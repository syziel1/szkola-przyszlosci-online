'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export type UserRole = 'administrator' | 'konsultant' | 'nauczyciel' | 'opiekun' | 'uczen';

interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  metadata: Record<string, any> | null;
  last_login_at: string | null;
}

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setRole(data.role as UserRole);
      }
      setLoading(false);
    };

    fetchRole();

    const channel = supabase
      .channel('user_profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { role, loading };
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
      setLoading(false);
    };

    fetchProfile();

    const channel = supabase
      .channel('user_profile_changes_full')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
  };
}
