'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

type AuthSettings = Database['public']['Tables']['auth_settings']['Row'];
type AuthSettingsUpdate = Database['public']['Tables']['auth_settings']['Update'];

export function useAuthSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('auth_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania ustawień');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    if (!user) return;

    const channel = supabase
      .channel('auth_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auth_settings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateSettings = async (updates: AuthSettingsUpdate) => {
    if (!user) {
      return {
        data: null,
        error: 'Użytkownik niezalogowany',
      };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('auth_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji ustawień',
      };
    }
  };

  const resetFailedLoginAttempts = async () => {
    return updateSettings({
      failed_login_attempts: 0,
      account_locked_until: null,
    });
  };

  const lockAccount = async (durationMinutes: number = 30) => {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + durationMinutes);

    return updateSettings({
      account_locked_until: lockUntil.toISOString(),
    });
  };

  const unlockAccount = async () => {
    return updateSettings({
      account_locked_until: null,
      failed_login_attempts: 0,
    });
  };

  const incrementFailedLoginAttempts = async () => {
    if (!settings) return { data: null, error: 'Brak ustawień' };

    const newAttempts = (settings.failed_login_attempts || 0) + 1;
    const maxAttempts = 5;

    if (newAttempts >= maxAttempts) {
      return lockAccount(30);
    }

    return updateSettings({
      failed_login_attempts: newAttempts,
    });
  };

  const isAccountLocked = (): boolean => {
    if (!settings || !settings.account_locked_until) return false;

    const lockUntil = new Date(settings.account_locked_until);
    const now = new Date();

    return lockUntil > now;
  };

  const updatePasswordChangeTime = async () => {
    return updateSettings({
      last_password_change: new Date().toISOString(),
      require_password_change: false,
    });
  };

  const enable2FA = async () => {
    return updateSettings({ enable_2fa: true });
  };

  const disable2FA = async () => {
    return updateSettings({ enable_2fa: false });
  };

  const updateSessionTimeout = async (minutes: number) => {
    if (minutes <= 0) {
      return {
        data: null,
        error: 'Timeout musi być większy od 0',
      };
    }

    return updateSettings({ session_timeout_minutes: minutes });
  };

  const toggleEmailNotifications = async (enabled: boolean) => {
    return updateSettings({ email_notifications: enabled });
  };

  const toggleLoginNotifications = async (enabled: boolean) => {
    return updateSettings({ login_notification: enabled });
  };

  const setBackupEmail = async (email: string | null) => {
    return updateSettings({ backup_email: email });
  };

  const setAllowedIPs = async (ips: string[] | null) => {
    return updateSettings({ allowed_ip_addresses: ips });
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetFailedLoginAttempts,
    lockAccount,
    unlockAccount,
    incrementFailedLoginAttempts,
    isAccountLocked,
    updatePasswordChangeTime,
    enable2FA,
    disable2FA,
    updateSessionTimeout,
    toggleEmailNotifications,
    toggleLoginNotifications,
    setBackupEmail,
    setAllowedIPs,
    refresh: fetchSettings,
  };
}
