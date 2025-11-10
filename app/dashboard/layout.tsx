'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, Calendar, Settings, Shield, UserCog, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const { canManageUsers, canViewStudentsMenu, loading: permissionsLoading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Ładowanie...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getRoleBadge = () => {
    if (!profile?.role) return null;

    const roleLabels: Record<string, string> = {
      administrator: 'Administrator',
      konsultant: 'Konsultant',
      nauczyciel: 'Nauczyciel',
      opiekun: 'Opiekun',
      uczen: 'Uczeń',
    };

    const roleColors: Record<string, string> = {
      administrator: 'bg-red-100 text-red-800',
      konsultant: 'bg-blue-100 text-blue-800',
      nauczyciel: 'bg-green-100 text-green-800',
      opiekun: 'bg-purple-100 text-purple-800',
      uczen: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={`${roleColors[profile.role]} border-0`}>
        {roleLabels[profile.role] || profile.role}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-gray-800" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Baza Uczniów</span>
              </Link>
              <div className="hidden md:flex space-x-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Kokpit
                  </Button>
                </Link>
                {(canViewStudentsMenu || (profile?.role && ['administrator', 'konsultant', 'nauczyciel', 'opiekun'].includes(profile.role))) && (
                  <Link href="/dashboard/uczniowie">
                    <Button variant="ghost" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Uczniowie
                    </Button>
                  </Link>
                )}
                {(canManageUsers || profile?.role === 'administrator') && (
                  <Link href="/dashboard/admin">
                    <Button variant="ghost" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Administracja
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {profile?.full_name || user.email}
                </span>
                {getRoleBadge()}
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Wyloguj
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
