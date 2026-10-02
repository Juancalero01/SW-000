export interface Permission {
  id: number;
  action: string;
  subject: string;
  fields?: string[];
  conditions?: Record<string, any>;
  inverted?: boolean;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  mustChangePassword?: boolean;
  phoneNumber?: string;
  roles?: Role[];
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AppModule {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  route: string;
  icon?: string | null;
  order: number;
  isActive: boolean;
}
