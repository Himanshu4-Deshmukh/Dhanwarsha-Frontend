const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (data: { name: string; email: string; password: string }) =>
    request<{ access_token: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  // User
  getProfile: () => request<any>('/users/profile'),
  
  // Wallet
  getWallet: () => request<{ balance: number }>('/wallet'),
  getBalance: () => request<{ balance: number }>('/wallet/balance'),
  getTransactions: () => request<any[]>('/wallet-transactions'),
  
  // Slots
  getActiveSlot: () => request<any>('/slots/active'),
  getSlots: () => request<any[]>('/slots'),
  getSlot: (id: string) => request<any>(`/slots/${id}`),
  
  // Bets
  placeBet: (slotId: string, number: number) =>
    request<any>('/bets', { method: 'POST', body: JSON.stringify({ slotId, number }) }),
  getMyBets: () => request<any[]>('/bets/my-bets'),
  
  // Payments
  requestPayment: (amount: number, screenshotUrl: string) =>
    request<any>('/payments/request', { method: 'POST', body: JSON.stringify({ amount, screenshotUrl }) }),
  getMyPayments: () => request<any[]>('/payments/my-requests'),
};
