// src/routes/api-test/stores/singleRetryService.ts
import type { ResponseData } from './types';
import { supabase } from '$lib/supabaseClient';
import { retryingIdsStore } from './retryStoreUtils';
import { 
  processStreamingResponse, 
  handleStreamingFailure, 
  makeJsonRequest 
} from './retryStreamHandler';

// Retry a single response
export async function retryResponse(
  response: ResponseData, 
  batchId: string | null
) {
  // Add the response ID to the retrying IDs set
  retryingIdsStore.update(ids => {
    const newIds = new Set(ids);
    newIds.add(response.id);
    return newIds;
  });
  
  try {
    console.log(`Retrying response ${response.id}...`);
    
    // Prepare request data
    const formData = {
      query: response.input_text,
      group_id: `retry_${response.id}_${Date.now()}`,
      persona: "선생님",
      user_type: ""
    };
    
    console.log('Retry request data:', formData);
    
    // Variables to store our results
    let streamingText = '';
    let metadata: any = null;
    let streamingFailed = false;
    
    // Collect status texts for fallback response construction
    const statusTexts: string[] = [];
    
    // First try to handle as a streaming response
    try {
      // Make the API request for streaming
      const apiResponse = await fetch('https://cne-dev-hcx.clabi.co.kr/api/v1/clario/main', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(formData)
      });
      
      console.log('API response status:', apiResponse.status, apiResponse.statusText);
      
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }
      
      // Process the streaming response
      const result = await processStreamingResponse(apiResponse, response);
      streamingText = result.streamingText;
      metadata = result.metadata;
      statusTexts.push(...result.statusTexts);
      
    } catch (streamError: unknown) {
      console.error('Error during stream processing:', streamError);
      streamingFailed = true;
      
      // Handle streaming failure
      const result = handleStreamingFailure(streamingText, metadata, statusTexts, response);
      streamingText = result.streamingText;
      metadata = result.metadata;
    }
    
    // If we already have both text and metadata from the streaming attempt, 
    // don't bother with the JSON approach
    if (streamingText && metadata) {
      console.log('Already have complete data from streaming, skipping JSON approach');
    }
    // If streaming failed or we didn't get complete data, try a separate JSON request
    else if (streamingFailed || !streamingText || !metadata) {
      console.log('Streaming approach failed or incomplete, trying direct JSON request...');
      try {
        // Make a separate request for JSON data
        const jsonResult = await makeJsonRequest(formData, response);
        streamingText = jsonResult.text;
        metadata = jsonResult.metadata;
      } catch (jsonError) {
        console.error('Error during JSON request:', jsonError);
        
        // If we still don't have a response, set a generic error message
        if (!streamingText) {
          streamingText = '응답을 생성하는데 실패했습니다. 다시 시도해주세요.';
        }
        
        // If we still don't have metadata, create a basic one
        if (!metadata) {
          metadata = {
            input_text: response.input_text,
            query_category: response.query_category || '분류 없음',
            action: 'error',
            token_count: 0,
            response_id: `retry_error_${Date.now()}`,
            latency: 0,
            error_message: jsonError instanceof Error ? jsonError.message : String(jsonError)
          };
        }
      }
    }
    
    // Now we should have both text and metadata, so we can update the database
    console.log('Final response text:', streamingText.substring(0, 100) + '...');
    console.log('Final metadata:', metadata);
    
    // Delete the old response
    const { error: deleteError } = await supabase
      .from('clario_responses')
      .delete()
      .eq('id', response.id);
    
    if (deleteError) {
      console.error('Error deleting old response:', deleteError);
      throw new Error('기존 응답을 삭제하는데 실패했습니다.');
    }
    
    // Save the new response
    const { error: insertError } = await supabase
      .from('clario_responses')
      .insert({
        input_text: metadata.input_text,
        output_text: streamingText,
        query_category: metadata.query_category,
        action: metadata.action,
        token_count: metadata.token_count,
        response_id: metadata.response_id,
        latency: metadata.latency,
        batch_id: batchId,
        is_batch: batchId === null,
        error_message: metadata.error_message || null
      });
    
    if (insertError) {
      console.error('Error inserting new response:', insertError);
      throw new Error('새 응답을 저장하는데 실패했습니다.');
    }
    
    console.log('Response retry successful!');
    
  } catch (error) {
    console.error('Error retrying response:', error);
  } finally {
    // Remove the response ID from the retrying IDs set
    retryingIdsStore.update(ids => {
      const newIds = new Set(ids);
      newIds.delete(response.id);
      return newIds;
    });
  }
} 