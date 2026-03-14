export type UserRole = 'ADMIN' | 'USER' | string;
export type UserStatusFilter = 'ALL' | 'ACTIVE' | 'BLOCKED';
export type UserRoleFilter = 'ALL' | 'ADMIN' | 'USER';
export type UserModalTab = 'overview' | 'transactions' | 'payments';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string | null;
}

export interface AdminTransaction {
  _id: string;
  userId?: string;
  user?: { _id?: string; id?: string; name?: string; email?: string } | string;
  amount: number;
  type: string;
  createdAt: string;
}

export interface AdminPaymentRequest {
  _id: string;
  userId?: string;
  user?: { _id?: string; id?: string; name?: string; email?: string } | string;
  amount: number;
  status: string;
  createdAt: string;
  adminRemark?: string;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalCreditsDistributed: number;
}

export interface SelectedUserDetails {
  totalCredits: number;
  totalTransactions: number;
  totalPaymentRequests: number;
  lastLoginLabel: string;
}
