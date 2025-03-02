// src/routes/api-test/download.ts
import type { Metadata } from './types';

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