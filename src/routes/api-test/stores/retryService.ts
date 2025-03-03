import { writable, get } from 'svelte/store';
import type { ResponseData } from './types';
import { supabase } from '$lib/supabaseClient';

// Store for tracking retrying IDs
export const retryingIdsStore = writable<Set<number>>(new Set());

// Helper function to construct a meaningful response from status updates
function constructResponseFromStatusUpdates(statusTexts: string[]): string {
  if (statusTexts.length === 0) return '응답을 생성하지 못했습니다.';
  
  // Filter out duplicate and uninformative status messages
  const uniqueTexts = Array.from(new Set(statusTexts)).filter(text => 
    !text.includes('질문에 대한 내용을 답변드리기 위한 추론을 시작하겠습니다') &&
    !text.includes('질문을 분석하고 있습니다') &&
    !text.includes('질문에 답할 수 있는 정보를 찾고 있습니다') &&
    !text.includes('정보를 바탕으로 답변을 생성중입니다') &&
    !text.includes('DONE') &&
    !text.includes('FINISH')
  );
  
  if (uniqueTexts.length === 0) {
    return '응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
  
  // Construct a response that includes the information we've gathered
  return `[참고: 이 응답은 불완전한 데이터로부터 복구되었습니다]\n\n질문하신 내용에 대해 다음과 같은 정보를 찾았습니다:\n\n${uniqueTexts.join('\n\n')}\n\n더 자세한 정보를 원하시면 다시 질문해주세요.`;
}

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
      
      const reader = apiResponse.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream reading complete');
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunk.length, 'bytes');
        console.log('Chunk content:', chunk);
        buffer += chunk;
        
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        
        for (const event of events) {
          if (!event.trim()) continue;
          
          const lines = event.split('\n');
          const eventData: { [key: string]: string } = {};
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventData.event = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData.data = line.slice(6);
            }
          }
          
          if (eventData.event === 'ClarioResponse') {
            try {
              const parsedData = JSON.parse(eventData.data);
              console.log('Parsed event data type:', parsedData.type);
              console.log('Parsed event data:', parsedData);
              
              if (parsedData.type === 'response') {
                streamingText += parsedData.text;
              } else if (parsedData.type === 'all') {
                metadata = {
                  ...parsedData,
                  input_text: response.input_text,
                  query_category: response.query_category || '분류 없음',
                  action: parsedData.action || '',
                  token_count: parsedData.token_count || 0,
                  response_id: parsedData.response_id || '',
                  latency: parsedData.latency || 0
                };
                console.log('Received metadata:', metadata);
              }
            } catch (e) {
              console.error('Failed to parse response data:', e, 'Raw data:', eventData.data);
            }
          }
          // Also try to extract information from ClarioStatus events
          else if (eventData.event === 'ClarioStatus') {
            try {
              const statusData = JSON.parse(eventData.data);
              console.log('Status data:', statusData);
              
              // If we see a FINISH status, it means the response is complete
              if (statusData.type === 'FINISH') {
                console.log('Received FINISH status, response should be complete');
              }
              
              // Some status updates might contain useful text we can collect
              if (statusData.text && statusData.type !== 'DONE' && statusData.type !== 'FINISH') {
                console.log('Collecting text from status update:', statusData.text);
                // We'll collect this text as a fallback in case we don't get the actual response
                if (!streamingText) {
                  streamingText = ''; // Initialize if needed
                }
                // Add the status text to our collection, with a newline if we already have some text
                if (streamingText.length > 0) {
                  streamingText += '\n';
                }
                streamingText += statusData.text;
                
                // Also add to our status texts array for potential response construction
                statusTexts.push(statusData.text);
              }
            } catch (e) {
              console.error('Failed to parse status data:', e, 'Raw data:', eventData.data);
            }
          }
        }
      }
    } catch (streamError: unknown) {
      console.error('Error during stream processing:', streamError);
      streamingFailed = true;
      
      // Check if we've received partial data that we can use
      console.log('Checking for partial data - Text length:', streamingText.length, 'Metadata:', !!metadata);
      
      // If we have some text but no metadata, create basic metadata
      if (streamingText.length > 0 && !metadata) {
        console.log('We have partial text but no metadata, creating basic metadata');
        metadata = {
          input_text: response.input_text,
          query_category: response.query_category || '분류 없음',
          action: 'partial',
          token_count: 0,
          response_id: `retry_partial_${Date.now()}`,
          latency: 0
        };
        
        // Since we're creating metadata from partial data, let's add a note to the text
        streamingText = `[참고: 이 응답은 불완전한 데이터로부터 복구되었습니다]\n\n${streamingText}`;
      }
      
      // If we have metadata but no text, set a placeholder text
      if (!streamingText && metadata) {
        console.log('We have metadata but no text, setting placeholder text');
        streamingText = '응답이 불완전하게 수신되었습니다. 다시 시도해주세요.';
      }
      
      // If we have collected status texts but no proper response, construct one
      if ((!streamingText || streamingText.length === 0) && statusTexts.length > 0) {
        console.log('Constructing response from status texts');
        streamingText = constructResponseFromStatusUpdates(statusTexts);
        
        // Create basic metadata if needed
        if (!metadata) {
          metadata = {
            input_text: response.input_text,
            query_category: response.query_category || '분류 없음',
            action: 'constructed',
            token_count: 0,
            response_id: `retry_constructed_${Date.now()}`,
            latency: 0
          };
        }
      }
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
        const jsonRequestData = {
          ...formData,
          group_id: `retry_json_${response.id}_${Date.now()}`
        };
        console.log('JSON request data:', jsonRequestData);
        
        const jsonResponse = await fetch('https://cne-dev-hcx.clabi.co.kr/api/v1/clario/main', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(jsonRequestData)
        });
        
        console.log('JSON response status:', jsonResponse.status, jsonResponse.statusText);
        
        if (!jsonResponse.ok) {
          throw new Error(`HTTP error in JSON request! status: ${jsonResponse.status}`);
        }
        
        // Try to get the response as text first to see what we're getting
        const responseText = await jsonResponse.text();
        console.log('Raw JSON response text:', responseText);
        
        // Check if the response is in SSE format (contains event: lines)
        if (responseText.includes('event:')) {
          console.log('JSON response appears to be in SSE format, parsing manually');
          
          // Parse the SSE format manually
          const events = responseText.split('\n\n');
          let jsonData = null;
          let collectedText = '';
          const jsonStatusTexts: string[] = [];
          
          for (const event of events) {
            if (!event.trim()) continue;
            
            const lines = event.split('\n');
            const eventData: { [key: string]: string } = {};
            
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventData.event = line.slice(7);
              } else if (line.startsWith('data: ')) {
                eventData.data = line.slice(6);
              }
            }
            
            if (eventData.event === 'ClarioResponse') {
              try {
                const parsedData = JSON.parse(eventData.data);
                console.log('Parsed SSE response data:', parsedData);
                
                if (parsedData.type === 'response') {
                  collectedText += parsedData.text;
                } else if (parsedData.type === 'all') {
                  jsonData = parsedData;
                }
              } catch (e) {
                console.error('Failed to parse SSE response data:', e);
              }
            } else if (eventData.event === 'ClarioStatus') {
              try {
                const statusData = JSON.parse(eventData.data);
                
                // Collect text from status updates as a fallback
                if (statusData.text && statusData.type !== 'DONE' && statusData.type !== 'FINISH') {
                  if (collectedText.length > 0) {
                    collectedText += '\n';
                  }
                  collectedText += statusData.text;
                  jsonStatusTexts.push(statusData.text);
                }
              } catch (e) {
                console.error('Failed to parse SSE status data:', e);
              }
            }
          }
          
          // If we collected text but didn't get a full response object
          if (collectedText && !jsonData) {
            jsonData = {
              text: collectedText,
              action: 'sse_parsed',
              response_id: `retry_sse_${Date.now()}`
            };
          }
          
          // If we still don't have a proper response but have status texts, construct one
          if ((!jsonData || !jsonData.text) && jsonStatusTexts.length > 0) {
            const constructedResponse = constructResponseFromStatusUpdates(jsonStatusTexts);
            if (!jsonData) {
              jsonData = {
                text: constructedResponse,
                action: 'constructed',
                response_id: `retry_constructed_${Date.now()}`
              };
            } else {
              jsonData.text = constructedResponse;
            }
          }
          
          // Use the collected data
          if (jsonData) {
            console.log('Successfully parsed SSE data:', jsonData);
            
            // Extract the response text
            if (jsonData.text || collectedText) {
              streamingText = jsonData.text || collectedText;
            }
            
            // Create metadata
            metadata = {
              input_text: response.input_text,
              query_category: response.query_category || '분류 없음',
              action: jsonData.action || 'sse_parsed',
              sub_action: jsonData.sub_action || null,
              token_count: jsonData.token_count || 0,
              response_id: jsonData.response_id || `retry_sse_${Date.now()}`,
              latency: jsonData.latency || 0,
              reference: jsonData.reference || null,
              recommended_questions: jsonData.recommended_questions || null,
              images: jsonData.images || null
            };
          }
        } else {
          // Try to parse as regular JSON
          const jsonData = responseText ? JSON.parse(responseText) : null;
          console.log('Received JSON response:', jsonData);
          
          // Extract the response text from the JSON response
          if (jsonData && jsonData.text) {
            streamingText = jsonData.text;
          }
          
          // Create metadata from the JSON response
          if (jsonData) {
            metadata = {
              input_text: response.input_text,
              query_category: response.query_category || '분류 없음',
              action: jsonData.action || '',
              sub_action: jsonData.sub_action || null,
              token_count: jsonData.token_count || 0,
              response_id: jsonData.response_id || `retry_${Date.now()}`,
              latency: jsonData.latency || 0,
              reference: jsonData.reference || null,
              recommended_questions: jsonData.recommended_questions || null,
              images: jsonData.images || null
            };
            
            console.log('Created metadata from JSON response:', metadata);
          } else {
            console.error('No JSON data received from response');
          }
        }
      } catch (jsonError) {
        console.error('Failed to make JSON request:', jsonError);
        
        // If both approaches failed, try a third approach with a different endpoint
        try {
          console.log('Trying alternative endpoint...');
          
          // Make a request to an alternative endpoint
          const altRequestData = {
            query: formData.query,
            group_id: `retry_alt_${response.id}_${Date.now()}`
          };
          console.log('Alternative request data:', altRequestData);
          
          const altResponse = await fetch('https://cne-dev-hcx.clabi.co.kr/api/v1/clario/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(altRequestData)
          });
          
          console.log('Alternative response status:', altResponse.status, altResponse.statusText);
          
          if (!altResponse.ok) {
            throw new Error(`HTTP error in alternative request! status: ${altResponse.status}`);
          }
          
          // Try to get the response as text first
          const altResponseText = await altResponse.text();
          console.log('Raw alternative response text:', altResponseText);
          
          // Then parse it as JSON
          const altData = altResponseText ? JSON.parse(altResponseText) : null;
          console.log('Received alternative response:', altData);
          
          // Extract data from alternative endpoint
          if (altData && altData.response) {
            streamingText = altData.response;
            
            // Create basic metadata
            metadata = {
              input_text: response.input_text,
              query_category: response.query_category || '분류 없음',
              action: 'query',
              token_count: 0,
              response_id: `retry_alt_${Date.now()}`,
              latency: 0
            };
            
            console.log('Created metadata from alternative response:', metadata);
          } else {
            console.error('No valid data in alternative response');
          }
        } catch (altError) {
          console.error('Failed alternative approach:', altError);
          
          // If all approaches failed, throw an error
          if (streamingFailed) {
            throw new Error('모든 재시도 방법이 실패했습니다. 네트워크 연결을 확인해주세요.');
          }
        }
      }
    }
    
    console.log('Final streaming text length:', streamingText.length);
    console.log('Metadata received:', !!metadata);
    
    // If we have a response, update the database
    if (streamingText && metadata) {
      try {
        // Save the new response
        const { data, error } = await supabase.from('clario_responses').insert({
          response_text: streamingText,
          input_text: response.input_text,
          reference: metadata.reference || null,
          recommended_questions: metadata.recommended_questions || null,
          images: metadata.images || null,
          action: metadata.action || '',
          sub_action: metadata.sub_action || null,
          token_count: metadata.token_count || 0,
          response_id: metadata.response_id || `retry_${response.id}_${Date.now()}`,
          latency: metadata.latency || 0,
          batch_id: batchId || null,
          is_batch: !!batchId,
          query_category: response.query_category || null
        }).select();
        
        if (error) {
          console.error('Error saving response to database:', error);
          throw new Error(`데이터베이스 저장 오류: ${error.message}`);
        }
        
        console.log('Successfully saved response to database:', data);
        return true;
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        throw dbError;
      }
    } else {
      throw new Error('응답을 받지 못했습니다. 스트리밍 텍스트: ' + (streamingText ? '있음' : '없음') + ', 메타데이터: ' + (metadata ? '있음' : '없음'));
    }
  } catch (error) {
    console.error('Retry error:', error);
    alert(error instanceof Error ? error.message : '재시도 중 오류가 발생했습니다.');
    return false;
  } finally {
    // Remove from retrying IDs
    retryingIdsStore.update(ids => {
      const newIds = new Set(ids);
      newIds.delete(response.id);
      return newIds;
    });
  }
}

// Check if a response is currently being retried
export function isRetrying(id: number): boolean {
  return get(retryingIdsStore).has(id);
} 