const API_BASE =
  // import.meta.env.VITE_API_URL || "https://dhanwarsha.adonservice.in/api";
  import.meta.env.VITE_API_URL || "http://localhost:8001/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}

function toQueryString(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (data: { name: string; email: string; password: string }) =>
    request<{ access_token: string; user: any }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // User
  getProfile: () => request<any>("/users/profile"),

  // Wallet
  getWallet: () => request<{ balance: number }>("/wallet"),
  getBalance: () => request<{ balance: number }>("/wallet/balance"),
  getTransactions: () => request<any[]>("/wallet-transactions"),

  // Slots
  getActiveSlot: () => request<any>("/slots/active"),
  getSlots: () => request<any[]>("/slots"),
  getTodaySlots: () => request<any[]>("/slots/today"),
  getSlot: (id: string) => request<any>(`/slots/${id}`),
  createSlot: (data: {
    startTime: string;
    endTime: string;
    betAmount: number;
    winAmount: number;
  }) => request<any>("/slots", { method: "POST", body: JSON.stringify(data) }),
  setWinningNumber: (slotId: string, winningNumber: number) =>
    request<any>(`/slots/${slotId}/winning-number`, {
      method: "POST",
      body: JSON.stringify({ winningNumber }),
    }),
  updateSlotAmounts: (slotId: string, betAmount: number, winAmount: number) =>
    request<any>(`/slots/${slotId}/amounts`, {
      method: "PATCH",
      body: JSON.stringify({ betAmount, winAmount }),
    }),
  getSlotExposure: (slotId: string) =>
    request<any>(`/slots/${slotId}/exposure`),

  // Bets
  placeBet: (slotId: string, number: number) =>
    request<any>("/bets", {
      method: "POST",
      body: JSON.stringify({ slotId, number }),
    }),
  getMyBets: () => request<any[]>("/bets/my-bets"),

  // Payments
  uploadPaymentScreenshot: (file: File) => {
    const formData = new FormData();
    formData.append("screenshot", file);
    return request<{ screenshotUrl: string }>("/payments/upload-screenshot", {
      method: "POST",
      body: formData,
    });
  },
  requestPayment: (amount: number, screenshotUrl: string) =>
    request<any>("/payments/request", {
      method: "POST",
      body: JSON.stringify({ amount, screenshotUrl }),
    }),
  getMyPayments: () => request<any[]>("/payments/my-requests"),

  // Withdrawals
  createWithdrawal: (amount: number, upiId: string) =>
    request<any>("/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount, upiId }),
    }),
  getMyWithdrawals: () => request<any[]>("/withdrawals/my"),

  // Admin
  admin: {
    getAllUsers: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      email?: string;
    }) =>
      request<any>(
        `/users${toQueryString({
          page: params?.page,
          limit: params?.limit,
          search: params?.search,
          role: params?.role,
          status: params?.status,
          email: params?.email,
        })}`,
      ),
    getUserById: (userId: string) => request<any>(`/users/${userId}`),
    getAllBets: () => request<any[]>("/admin/bets"),
    getAllTransactions: () => request<any[]>("/admin/transactions"),

    // Payments
    getAllPaymentRequests: () => request<any[]>("/admin/payment-requests"),
    approvePayment: (id: string, adminRemark?: string) =>
      request<any>(`/admin/payment-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ adminRemark: adminRemark || "Approved" }),
      }),
    rejectPayment: (id: string, adminRemark?: string) =>
      request<any>(`/admin/payment-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminRemark: adminRemark || "Rejected" }),
      }),
    creditWallet: (userId: string, amount: number, reason?: string) =>
      request<any>(`/users/${userId}/add-credit`, {
        method: "POST",
        body: JSON.stringify({ amount, reason }),
      }),
    deductWallet: (userId: string, amount: number, reason?: string) =>
      request<any>(`/users/${userId}/deduct-credit`, {
        method: "POST",
        body: JSON.stringify({ amount, reason }),
      }),
    updateUserStatus: (userId: string, isActive: boolean) =>
      request<any>(`/users/${userId}/${isActive ? "unblock" : "block"}`, {
        method: "PATCH",
      }),
    updateUserRole: (userId: string, role: string) =>
      request<any>(`/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    deleteUser: (userId: string) =>
      request<any>(`/users/${userId}`, {
        method: "DELETE",
      }),
    getSlotProfit: (slotId: string) =>
      request<any>(`/admin/slots/${slotId}/profit`),

    // Withdrawals
    getAllWithdrawals: () => request<any[]>("/withdrawals/admin/all"),
    getPendingWithdrawalCount: () =>
      request<{ withdrawals: number }>("/withdrawals/admin/pending-count"),
    approveWithdrawal: (id: string, adminRemark?: string) =>
      request<any>(`/withdrawals/admin/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ adminRemark: adminRemark || "Approved" }),
      }),
    rejectWithdrawal: (id: string, adminRemark?: string) =>
      request<any>(`/withdrawals/admin/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminRemark: adminRemark || "Rejected" }),
      }),
  },
};