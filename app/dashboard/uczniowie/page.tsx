'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, UserCheck, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/lib/auth-context';

interface Student {
  id: string;
  imie: string;
  nazwisko: string;
  email: string | null;
  telefon: string | null;
  szkola: string | null;
  klasa: string | null;
  created_by: string;
  tutor_name?: string;
  guardian_count?: number;
}

export default function UczniwowiePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { role, canCreateStudents, isAdminOrKonsultant } = usePermissions();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    imie: '',
    nazwisko: '',
    email: '',
    telefon: '',
    whatsapp: '',
    messenger: '',
    szkola: '',
    klasa: '',
    notatki: '',
  });

  useEffect(() => {
    if (user && role) {
      loadStudents();
    }
  }, [user, role]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredStudents(students);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredStudents(
        students.filter(
          (s) =>
            s.imie.toLowerCase().includes(searchLower) ||
            s.nazwisko.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [search, students]);

  const loadStudents = async () => {
    if (!user || !role) return;

    try {
      let studentsData: Student[] = [];

      if (role === 'administrator' || role === 'konsultant') {
        const { data, error } = await supabase
          .from('uczniowie')
          .select('*')
          .order('nazwisko', { ascending: true });

        if (error) throw error;

        if (data) {
          const studentsWithDetails = await Promise.all(
            data.map(async (student: any) => {
              // Get tutor name from user_profiles
              const { data: profileData } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('user_id', student.created_by)
                .maybeSingle();

              // Get guardian count
              const { count } = await supabase
                .from('student_guardians')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', student.id);

              return {
                ...student,
                tutor_name: profileData?.full_name || 'Nieznany',
                guardian_count: count || 0,
              };
            })
          );
          studentsData = studentsWithDetails;
        }
      } else if (role === 'nauczyciel') {
        const { data, error } = await supabase
          .from('uczniowie')
          .select('*')
          .eq('created_by', user.id)
          .order('nazwisko', { ascending: true });

        if (error) throw error;
        if (data) {
          studentsData = data;
        }
      } else if (role === 'opiekun') {
        const { data, error } = await supabase
          .from('student_guardians')
          .select(`
            student_id,
            uczniowie!inner(
              id,
              imie,
              nazwisko,
              email,
              telefon,
              szkola,
              klasa,
              created_by
            )
          `)
          .eq('guardian_user_id', user.id);

        if (error) throw error;

        if (data) {
          const studentsWithTutorNames = await Promise.all(
            data.map(async (item: any) => {
              // Get tutor name from user_profiles
              const { data: profileData } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('user_id', item.uczniowie.created_by)
                .maybeSingle();

              return {
                ...item.uczniowie,
                tutor_name: profileData?.full_name || 'Nieznany',
              };
            })
          );
          studentsData = studentsWithTutorNames;
          studentsData.sort((a, b) => a.nazwisko.localeCompare(b.nazwisko));
        }
      }

      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się załadować uczniów',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: 'Błąd',
        description: 'Musisz być zalogowany',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('uczniowie').insert([
      {
        ...formData,
        created_by: userData.user.id,
      }
    ]);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sukces',
        description: 'Uczeń został dodany',
      });
      setDialogOpen(false);
      setFormData({
        imie: '',
        nazwisko: '',
        email: '',
        telefon: '',
        whatsapp: '',
        messenger: '',
        szkola: '',
        klasa: '',
        notatki: '',
      });
      loadStudents();
    }
  };

  const getPageDescription = () => {
    if (role === 'administrator' || role === 'konsultant') {
      return 'Lista wszystkich uczniów';
    } else if (role === 'nauczyciel') {
      return 'Lista Twoich uczniów';
    } else if (role === 'opiekun') {
      return 'Lista uczniów pod Twoją opieką';
    }
    return 'Lista uczniów';
  };

  const getEmptyStateMessage = () => {
    if (role === 'nauczyciel') {
      return 'Nie masz jeszcze żadnych uczniów. Dodaj pierwszego ucznia klikając przycisk powyżej.';
    } else if (role === 'opiekun') {
      return 'Nie jesteś jeszcze przypisany do żadnego ucznia. Skontaktuj się z nauczycielem lub administratorem.';
    }
    return 'Brak uczniów';
  };

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Uczniowie</h1>
          <p className="text-gray-600 mt-2">{getPageDescription()}</p>
        </div>
        {canCreateStudents && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
                <Plus className="w-4 h-4 mr-2" />
                Dodaj ucznia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nowy uczeń</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imie">Imię *</Label>
                    <Input
                      id="imie"
                      value={formData.imie}
                      onChange={(e) => setFormData({ ...formData, imie: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nazwisko">Nazwisko *</Label>
                    <Input
                      id="nazwisko"
                      value={formData.nazwisko}
                      onChange={(e) => setFormData({ ...formData, nazwisko: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefon">Telefon</Label>
                    <Input
                      id="telefon"
                      value={formData.telefon}
                      onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="messenger">Messenger</Label>
                    <Input
                      id="messenger"
                      value={formData.messenger}
                      onChange={(e) => setFormData({ ...formData, messenger: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="szkola">Szkoła</Label>
                    <Input
                      id="szkola"
                      value={formData.szkola}
                      onChange={(e) => setFormData({ ...formData, szkola: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="klasa">Klasa</Label>
                    <Input
                      id="klasa"
                      value={formData.klasa}
                      onChange={(e) => setFormData({ ...formData, klasa: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notatki">Notatki</Label>
                  <Textarea
                    id="notatki"
                    value={formData.notatki}
                    onChange={(e) => setFormData({ ...formData, notatki: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Anuluj
                  </Button>
                  <Button type="submit" className="bg-green-500 hover:bg-green-600">
                    Dodaj ucznia
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Szukaj po imieniu lub nazwisku..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>{getEmptyStateMessage()}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Link key={student.id} href={`/dashboard/uczniowie/${student.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {student.imie} {student.nazwisko}
                      </h3>
                      {student.szkola && (
                        <p className="text-sm text-gray-600 truncate">{student.szkola}</p>
                      )}
                      {student.klasa && (
                        <p className="text-sm text-gray-500">Klasa: {student.klasa}</p>
                      )}
                      {isAdminOrKonsultant && student.tutor_name && (
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {student.tutor_name}
                          </Badge>
                        </div>
                      )}
                      {isAdminOrKonsultant && student.guardian_count !== undefined && student.guardian_count > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            <UsersIcon className="w-3 h-3 mr-1" />
                            {student.guardian_count} {student.guardian_count === 1 ? 'opiekun' : 'opiekunów'}
                          </Badge>
                        </div>
                      )}
                      {role === 'opiekun' && student.tutor_name && (
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Nauczyciel: {student.tutor_name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
