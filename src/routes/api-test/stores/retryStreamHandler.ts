// src/routes/api-test/stores/retryStreamHandler.ts
import type { ResponseData } from './types';
import { constructResponseFromStatusUpdates } from './retryStoreUtils';

// Interface for stream processing result
export interface StreamProcessingResult {
  streamingText: string;
  metadata: any;
  statusTexts: string[];
}

// Process streaming response
export async function processStreamingResponse(
  apiResponse: Response, 
  response: ResponseData
): Promise<StreamProcessingResult> {
  let streamingText = '';
  let metadata: any = null;
  const statusTexts: string[] = [];
  
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
            // Add the status text to our collection
            statusTexts.push(statusData.text);
          }
        } catch (e) {
          console.error('Failed to parse status data:', e, 'Raw data:', eventData.data);
        }
      }
    }
  }
  
  return { streamingText, metadata, statusTexts };
}

// Handle streaming failure by constructing a response from partial data
export function handleStreamingFailure(
  streamingText: string,
  metadata: any,
  statusTexts: string[],
  response: ResponseData
): StreamProcessingResult {
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
  
  return { streamingText, metadata, statusTexts };
}

// Make a direct JSON request as a fallback
export async function makeJsonRequest(
  formData: any,
  response: ResponseData
): Promise<{ text: string, metadata: any }> {
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
    throw new Error(`HTTP error! status: ${jsonResponse.status}`);
  }
  
  const data = await jsonResponse.json();
  console.log('JSON response data:', data);
  
  // Extract text and metadata from the JSON response
  const text = data.text || '';
  const metadata = {
    ...data,
    input_text: response.input_text,
    query_category: response.query_category || '분류 없음',
    action: data.action || '',
    token_count: data.token_count || 0,
    response_id: data.response_id || '',
    latency: data.latency || 0
  };
  
  return { text, metadata };
} 