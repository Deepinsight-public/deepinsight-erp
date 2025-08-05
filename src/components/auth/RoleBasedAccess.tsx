import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types/auth';

interface RoleBasedAccessProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, if false, user needs ANY role
}

export function RoleBasedAccess({ 
  allowedRoles, 
  children, 
  fallback = <div>Access denied</div>,
  requireAll = false 
}: RoleBasedAccessProps) {
  const { roles, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  const userRoles = roles.map(r => r.role);
  
  const hasAccess = requireAll
    ? allowedRoles.every(role => userRoles.includes(role))
    : allowedRoles.some(role => userRoles.includes(role));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface PermissionBasedAccessProps {
  requiredPermission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionBasedAccess({ 
  requiredPermission, 
  children, 
  fallback = <div>Access denied</div> 
}: PermissionBasedAccessProps) {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return hasPermission(requiredPermission) ? <>{children}</> : <>{fallback}</>;
}