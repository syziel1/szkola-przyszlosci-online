'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/hooks/use-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Shield, Search, CreditCard as Edit, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface UserProfile {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  email?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { canManageUsers, loading: permissionsLoading } = usePermissions();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    full_name: '',
    role: 'nauczyciel',
  });
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    bio: '',
  });

  useEffect(() => {
    if (!permissionsLoading && !canManageUsers) {
      router.push('/dashboard');
    }
  }, [canManageUsers, permissionsLoading, router]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No session found');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load users');
      }

      const { users } = await response.json();
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować użytkowników',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No session found');
      }

      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      toast({
        title: 'Sukces',
        description: 'Zaproszenie zostało wysłane',
      });

      setInviteDialogOpen(false);
      setInviteData({ email: '', full_name: '', role: 'nauczyciel' });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się wysłać zaproszenia',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    // Check if this is the only administrator
    if (!currentStatus === false) { // If we're trying to deactivate
      const activeAdmins = users.filter(u => u.role === 'administrator' && u.is_active && u.user_id !== userId);
      const targetUser = users.find(u => u.user_id === userId);
      
      if (targetUser?.role === 'administrator' && activeAdmins.length === 0) {
        toast({
          title: 'Błąd',
          description: 'Nie można dezaktywować jedynego administratora',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Sukces',
        description: `Użytkownik został ${!currentStatus ? 'aktywowany' : 'dezaktywowany'}`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się zmienić statusu',
        variant: 'destructive',
      });
    }
  };

  const handleViewProfile = (user: UserProfile) => {
    setSelectedUser(user);
    setProfileData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      bio: user.bio || '',
    });
    setEditMode(false);
    setProfileDialogOpen(true);
  };

  const handleEditProfile = (user: UserProfile) => {
    setSelectedUser(user);
    setProfileData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      bio: user.bio || '',
    });
    setEditMode(true);
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profileData.full_name || null,
          phone: profileData.phone || null,
          bio: profileData.bio || null,
        })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast({
        title: 'Sukces',
        description: 'Profil został zaktualizowany',
      });

      setProfileDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się zaktualizować profilu',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'default';
      case 'konsultant':
        return 'secondary';
      case 'nauczyciel':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrator';
      case 'konsultant':
        return 'Konsultant';
      case 'nauczyciel':
        return 'Nauczyciel';
      case 'opiekun':
        return 'Opiekun';
      case 'uczen':
        return 'Uczeń';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const staffUsers = filteredUsers.filter((u) =>
    ['administrator', 'konsultant', 'nauczyciel'].includes(u.role)
  );

  if (permissionsLoading || loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  if (!canManageUsers) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zarządzanie Użytkownikami</h1>
          <p className="text-gray-600 mt-2">Zarządzaj członkami zespołu i przypisuj role</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
              <UserPlus className="w-4 h-4 mr-2" />
              Zaproś Członka Zespołu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zaproś Nowego Członka Zespołu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="full_name">Imię i Nazwisko *</Label>
                <Input
                  id="full_name"
                  value={inviteData.full_name}
                  onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Rola *</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="konsultant">Konsultant</SelectItem>
                    <SelectItem value="nauczyciel">Nauczyciel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600">
                  Wyślij Zaproszenie
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wszyscy Użytkownicy</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Członkowie Zespołu</CardTitle>
            <Shield className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktywni Użytkownicy</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Członkowie Zespołu</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Szukaj użytkowników..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ostatnie Logowanie</TableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Brak członków zespołu
                  </TableCell>
                </TableRow>
              ) : (
                staffUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'Brak imienia'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString('pl-PL')
                        : 'Nigdy'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProfile(user)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Podgląd
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProfile(user)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edytuj
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user.user_id, user.is_active)}
                        >
                          {user.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edytuj Profil' : 'Podgląd Profilu'} - {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile_email">Email</Label>
                  <Input
                    id="profile_email"
                    value={selectedUser.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="profile_role">Rola</Label>
                  <Input
                    id="profile_role"
                    value={getRoleLabel(selectedUser.role)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="profile_full_name">Imię i Nazwisko</Label>
                <Input
                  id="profile_full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  disabled={!editMode}
                  className={!editMode ? 'bg-gray-50' : ''}
                />
              </div>
              <div>
                <Label htmlFor="profile_phone">Telefon</Label>
                <Input
                  id="profile_phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!editMode}
                  className={!editMode ? 'bg-gray-50' : ''}
                />
              </div>
              <div>
                <Label htmlFor="profile_bio">Bio</Label>
                <Textarea
                  id="profile_bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  disabled={!editMode}
                  className={!editMode ? 'bg-gray-50' : ''}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                      {selectedUser.is_active ? 'Aktywny' : 'Nieaktywny'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Ostatnie Logowanie</Label>
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedUser.last_login_at
                      ? new Date(selectedUser.last_login_at).toLocaleDateString('pl-PL')
                      : 'Nigdy'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setProfileDialogOpen(false)}>
                  {editMode ? 'Anuluj' : 'Zamknij'}
                </Button>
                {editMode && (
                  <Button type="submit" className="bg-green-500 hover:bg-green-600">
                    Zapisz Zmiany
                  </Button>
                )}
                {!editMode && (
                  <Button 
                    type="button" 
                    onClick={() => setEditMode(true)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edytuj
                  </Button>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
