export async function chatCompletion(userMessage) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userMessage }),
  });

  if (!response.ok) {
    throw new Error('API 요청 실패');
  }

  const data = await response.json();
  return data.content;
}
