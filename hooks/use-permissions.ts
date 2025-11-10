'use client';

import { useAuth } from '@/lib/auth-context';

export type UserRole = 'administrator' | 'konsultant' | 'nauczyciel' | 'opiekun' | 'uczen';

export function useRole() {
  const { profile, loading } = useAuth();

  const role = profile?.role ?? null;

  return { role, loading };
}

export function useUserProfile() {
  const { profile, loading } = useAuth();

  return { profile, loading };
}

export function useIsRole(targetRole: UserRole | UserRole[]) {
  const { role, loading } = useRole();

  if (loading) return { isRole: false, loading: true };

  if (Array.isArray(targetRole)) {
    return { isRole: role ? targetRole.includes(role) : false, loading: false };
  }

  return { isRole: role === targetRole, loading: false };
}

export function usePermissions() {
  const { role, loading } = useRole();

  const canEditStudents = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel'].includes(role);
  };

  const canViewAllStudents = () => {
    if (!role) return false;
    return ['administrator', 'konsultant'].includes(role);
  };

  const canManageUsers = () => {
    if (!role) return false;
    return role === 'administrator';
  };

  const canAssignRoles = () => {
    if (!role) return false;
    return role === 'administrator';
  };

  const canCreateStudents = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel'].includes(role);
  };

  const canDeleteStudents = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel'].includes(role);
  };

  const canManageClasses = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel'].includes(role);
  };

  const canViewPayments = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel', 'opiekun'].includes(role);
  };

  const canManagePayments = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel'].includes(role);
  };

  const canLinkGuardians = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel'].includes(role);
  };

  const canCreateStudentAccounts = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel'].includes(role);
  };

  const isStaff = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel'].includes(role);
  };

  const isAdminOrKonsultant = () => {
    if (!role) return false;
    return ['administrator', 'konsultant'].includes(role);
  };

  const canViewStudentsMenu = () => {
    if (!role) return false;
    return ['administrator', 'konsultant', 'nauczyciel', 'opiekun'].includes(role);
  };

  return {
    role,
    loading,
    canEditStudents: canEditStudents(),
    canViewAllStudents: canViewAllStudents(),
    canManageUsers: canManageUsers(),
    canAssignRoles: canAssignRoles(),
    canCreateStudents: canCreateStudents(),
    canDeleteStudents: canDeleteStudents(),
    canManageClasses: canManageClasses(),
    canViewPayments: canViewPayments(),
    canManagePayments: canManagePayments(),
    canLinkGuardians: canLinkGuardians(),
    canCreateStudentAccounts: canCreateStudentAccounts(),
    isStaff: isStaff(),
    isAdminOrKonsultant: isAdminOrKonsultant(),
    canViewStudentsMenu: canViewStudentsMenu(),
  };
}
