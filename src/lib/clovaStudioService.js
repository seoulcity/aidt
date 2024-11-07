// src/lib/clovaStudioService.js
export async function chatCompletion(systemPrompt, userMessage) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ systemPrompt, userMessage }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'API 요청 실패');
  }

  const data = await response.json();
  return data.content;
}
