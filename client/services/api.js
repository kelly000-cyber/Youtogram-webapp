const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetcher(url, options) {
  let response;
  const token = typeof window !== 'undefined' ? localStorage.getItem('youtogram_token') : null;
  const headers = { ...(options?.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error(`Cannot reach the backend at ${API_BASE}. Make sure MongoDB and the server are running.`);
  }

  let data = {};
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data.message || 'API error');
  }

  return data;
}
