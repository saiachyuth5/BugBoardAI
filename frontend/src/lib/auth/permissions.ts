import { createClient } from '@/utils/supabase/client';
import { Permission, PERMISSIONS } from './types';

/**
 * Check if the current user has a specific permission
 * @param permission - The permission to check (e.g., 'manage_users')
 * @returns Promise<boolean> - Whether the user has the permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Super admins have all permissions
  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', {
    user_id: user.id
  });
  
  if (isSuperAdmin) return true;

  // Check if the user has the specific permission
  const { data: hasPerm } = await supabase.rpc('has_permission', {
    user_id: user.id,
    permission_name: permission
  });

  return hasPerm || false;
}

/**
 * Get all permissions for the current user
 * @returns Promise<string[]> - Array of permission names the user has
 */
export async function getUserPermissions(): Promise<string[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: permissions, error } = await supabase
    .rpc('get_user_permissions', {
      user_id: user.id
    });

  if (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }

  return permissions || [];
}

/**
 * Check if the current user has any of the specified permissions
 * @param requiredPermissions - Array of permissions to check
 * @returns Promise<boolean> - Whether the user has any of the permissions
 */
export async function hasAnyPermission(requiredPermissions: string[]): Promise<boolean> {
  if (!requiredPermissions.length) return true;
  
  const userPermissions = await getUserPermissions();
  
  // If user has any of the required permissions
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * Check if the current user has all of the specified permissions
 * @param requiredPermissions - Array of permissions to check
 * @returns Promise<boolean> - Whether the user has all of the permissions
 */
export async function hasAllPermissions(requiredPermissions: string[]): Promise<boolean> {
  if (!requiredPermissions.length) return true;
  
  const userPermissions = await getUserPermissions();
  
  // If user has all of the required permissions
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * Higher-order component to protect routes based on permissions
 * @param Component - The component to protect
 * @param requiredPermission - The permission required to access the component
 * @param FallbackComponent - Component to render if user doesn't have permission
 * @returns Protected component
 */
export function withPermission<T>(
  Component: React.ComponentType<T>,
  requiredPermission: string,
  FallbackComponent: React.ComponentType = () => null
) {
  return function WithPermissionWrapper(props: T) {
    const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
    
    React.useEffect(() => {
      const checkPermission = async () => {
        const access = await hasPermission(requiredPermission);
        setHasAccess(access);
      };
      
      checkPermission();
    }, [requiredPermission]);
    
    if (hasAccess === null) {
      // Show loading state
      return <div>Loading...</div>;
    }
    
    return hasAccess ? <Component {...(props as any)} /> : <FallbackComponent />;
  };
}

// Export permission constants for easy access
export { PERMISSIONS };
