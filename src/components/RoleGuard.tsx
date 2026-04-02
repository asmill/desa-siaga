import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore, type UserRole } from '../store/useStore';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { userProfile, role } = useStore();

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // If not allowed, redirect to their home based on role
    if (role === 'Admin') return <Navigate to="/admin" replace />;
    if (role === 'Supir') return <Navigate to="/driver" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
