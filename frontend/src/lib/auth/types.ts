export type Permission = {
  id: number;
  name: string;
  description: string;
  created_at: string;
};

export type Role = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
};

export type UserRole = {
  id: number;
  user_id: string;
  role_id: number;
  created_at: string;
  role: Role;
};

export type AuditLog = {
  id: number;
  admin_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  previous_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin?: {
    id: string;
    email: string;
    full_name: string | null;
  };
};

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_BUGS: 'manage_bugs',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_DATA: 'export_data',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;
