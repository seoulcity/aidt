// src/routes/api-test/download.ts
import type { Metadata } from './types';
import type { ResponseData } from './stores/types';

export function downloadJSON(streamingText: string, metadata: Metadata) {
  const data = {
    response: streamingText,
    metadata: {
      input_text: metadata.input_text,
      reference: metadata.reference,
      recommended_questions: metadata.recommended_questions,
      images: metadata.images,
      action: metadata.action,
      sub_action: metadata.sub_action,
      token_count: metadata.token_count,
      response_id: metadata.response_id,
      latency: metadata.latency,
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadFile(blob, `clario-response-${new Date().toISOString()}.json`);
}

export function downloadCSV(streamingText: string, metadata: Metadata) {
  const rows = [
    ['Field', 'Value'],
    ['Query', metadata.input_text],
    ['Response', streamingText],
    ['Action', metadata.action],
    ['Sub Action', metadata.sub_action || ''],
    ['Token Count', metadata.token_count.toString()],
    ['Latency (s)', metadata.latency.toString()],
    ['Response ID', metadata.response_id],
    ['References', (metadata.reference || []).join('; ')],
    ['Recommended Questions', (metadata.recommended_questions || []).join('; ')],
    ['Images', (metadata.images || []).join('; ')],
  ];

  const csvContent = rows
    .map(row => row
      .map(cell => {
        const escaped = cell.replace(/"/g, '""');
        return /[,\n"]/.test(cell) ? `"${escaped}"` : cell;
      })
      .join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `clario-response-${new Date().toISOString()}.csv`);
}

export function downloadBatchCSV(responses: ResponseData[], batchId: string) {
  // Create header row
  const headers = ['Query', 'Response', 'Category', 'Created At', 'Action', 'Sub Action', 'Token Count', 'Latency (s)', 'Response ID', 'References', 'Recommended Questions', 'Error'];
  
  // Create data rows
  const rows = responses.map(response => {
    // Ensure reference and recommended_questions are arrays
    const reference = Array.isArray(response.reference) ? response.reference : [];
    const recommendedQuestions = Array.isArray(response.recommended_questions) ? response.recommended_questions : [];
    
    return [
      response.input_text || '',
      response.response_text || '',
      response.query_category || '',
      response.created_at || '',
      response.action || '',
      response.sub_action || '',
      response.token_count?.toString() || '',
      response.latency?.toFixed(2) || '',
      response.response_id || '',
      reference.join('; '),
      recommendedQuestions.join('; '),
      response.error_message || ''
    ];
  });
  
  // Combine header and data rows
  const allRows = [headers, ...rows];
  
  // Convert to CSV
  const csvContent = allRows
    .map(row => row
      .map(cell => {
        if (cell === null || cell === undefined) return '';
        const escaped = String(cell).replace(/"/g, '""');
        return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
      })
      .join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `batch-${batchId}-${new Date().toISOString()}.csv`);
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 