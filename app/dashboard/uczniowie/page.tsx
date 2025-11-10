'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Phone, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/lib/auth-context';
import { formatClassDateTimeWithCountdown } from '@/lib/date-utils';

interface ClassInfo {
  id: string;
  start_at: string;
  subject: string;
}

interface StudentWithClasses {
  id: string;
  imie: string;
  nazwisko: string;
  email: string | null;
  telefon: string | null;
  whatsapp: string | null;
  messenger: string | null;
  szkola: string | null;
  klasa: string | null;
  notatki: string | null;
  created_by: string;
  lastClass: ClassInfo | null;
  nextClass: ClassInfo | null;
}

type SortField = 'nazwisko' | 'lastClass' | 'nextClass';
type SortDirection = 'asc' | 'desc';

export default function UczniwowiePage() {
  const [students, setStudents] = useState<StudentWithClasses[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithClasses[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithClasses | null>(null);
  const [sortField, setSortField] = useState<SortField>('nazwisko');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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

  const [editFormData, setEditFormData] = useState({
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
    filterAndSortStudents();
  }, [search, students, sortField, sortDirection]);

  const filterAndSortStudents = () => {
    let filtered = [...students];

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.imie.toLowerCase().includes(searchLower) ||
          s.nazwisko.toLowerCase().includes(searchLower) ||
          (s.telefon && s.telefon.toLowerCase().includes(searchLower)) ||
          (s.email && s.email.toLowerCase().includes(searchLower))
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'nazwisko') {
        comparison = a.nazwisko.localeCompare(b.nazwisko);
      } else if (sortField === 'lastClass') {
        const aDate = a.lastClass?.start_at || '';
        const bDate = b.lastClass?.start_at || '';
        comparison = aDate.localeCompare(bDate);
      } else if (sortField === 'nextClass') {
        const aDate = a.nextClass?.start_at || '';
        const bDate = b.nextClass?.start_at || '';
        comparison = aDate.localeCompare(bDate);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredStudents(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1 inline" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline" />
    );
  };

  const loadStudents = async () => {
    if (!user || !role) return;

    try {
      let studentsData: any[] = [];

      if (role === 'administrator' || role === 'konsultant') {
        const { data, error } = await supabase
          .from('uczniowie')
          .select('*')
          .order('nazwisko', { ascending: true });

        if (error) throw error;
        studentsData = data || [];
      } else if (role === 'nauczyciel') {
        const { data, error } = await supabase
          .from('uczniowie')
          .select('*')
          .eq('created_by', user.id)
          .order('nazwisko', { ascending: true });

        if (error) throw error;
        studentsData = data || [];
      } else if (role === 'opiekun') {
        const { data, error } = await supabase
          .from('student_guardians')
          .select(`
            student_id,
            uczniowie!inner(*)
          `)
          .eq('guardian_user_id', user.id);

        if (error) throw error;
        studentsData = data ? data.map((item: any) => item.uczniowie) : [];
      }

      const studentsWithClasses = await Promise.all(
        studentsData.map(async (student: any) => {
          const now = new Date().toISOString();

          const { data: lastClassData } = await supabase
            .from('zajecia')
            .select('id, start_at, subject')
            .eq('student_id', student.id)
            .lt('start_at', now)
            .order('start_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: nextClassData } = await supabase
            .from('zajecia')
            .select('id, start_at, subject')
            .eq('student_id', student.id)
            .gte('start_at', now)
            .order('start_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          return {
            ...student,
            lastClass: lastClassData || null,
            nextClass: nextClassData || null,
          };
        })
      );

      setStudents(studentsWithClasses);
      setFilteredStudents(studentsWithClasses);
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

  const handleEditClick = (student: StudentWithClasses) => {
    setEditingStudent(student);
    setEditFormData({
      imie: student.imie,
      nazwisko: student.nazwisko,
      email: student.email || '',
      telefon: student.telefon || '',
      whatsapp: student.whatsapp || '',
      messenger: student.messenger || '',
      szkola: student.szkola || '',
      klasa: student.klasa || '',
      notatki: student.notatki || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStudent) return;

    const { error } = await supabase
      .from('uczniowie')
      .update({
        imie: editFormData.imie,
        nazwisko: editFormData.nazwisko,
        email: editFormData.email || null,
        telefon: editFormData.telefon || null,
        whatsapp: editFormData.whatsapp || null,
        messenger: editFormData.messenger || null,
        szkola: editFormData.szkola || null,
        klasa: editFormData.klasa || null,
        notatki: editFormData.notatki || null,
      })
      .eq('id', editingStudent.id);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sukces',
        description: 'Dane ucznia zostały zaktualizowane',
      });
      setEditDialogOpen(false);
      setEditingStudent(null);
      loadStudents();
    }
  };

  const canEditStudent = (student: StudentWithClasses) => {
    if (role === 'administrator' || role === 'konsultant') return true;
    if (role === 'nauczyciel' && student.created_by === user?.id) return true;
    return false;
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

  const renderClassInfo = (classData: ClassInfo | null) => {
    if (!classData) {
      return <span className="text-gray-400 text-sm">Brak danych</span>;
    }

    const { dateTime, countdown, isToday } = formatClassDateTimeWithCountdown(classData.start_at);

    return (
      <div className="text-sm">
        <div className={isToday ? 'font-bold text-green-600' : ''}>
          {dateTime}
        </div>
        {countdown && (
          <Badge variant={isToday ? 'default' : 'secondary'} className="mt-1 text-xs">
            {countdown}
          </Badge>
        )}
      </div>
    );
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
          placeholder="Szukaj po nazwisku, imieniu, telefonie lub emailu..."
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
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('nazwisko')}
                  >
                    Nazwisko
                    {getSortIcon('nazwisko')}
                  </TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Messenger</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('lastClass')}
                  >
                    Ostatnie zajęcia
                    {getSortIcon('lastClass')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('nextClass')}
                  >
                    Następne zajęcia
                    {getSortIcon('nextClass')}
                  </TableHead>
                  <TableHead className="text-center">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {student.imie} {student.nazwisko}
                    </TableCell>
                    <TableCell>
                      {student.telefon ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {student.telefon}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.whatsapp ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          {student.whatsapp}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.messenger ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          {student.messenger}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.email ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {student.email}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{renderClassInfo(student.lastClass)}</TableCell>
                    <TableCell>{renderClassInfo(student.nextClass)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/dashboard/uczniowie/${student.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {canEditStudent(student) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(student)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edytuj ucznia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-imie">Imię *</Label>
                <Input
                  id="edit-imie"
                  value={editFormData.imie}
                  onChange={(e) => setEditFormData({ ...editFormData, imie: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-nazwisko">Nazwisko *</Label>
                <Input
                  id="edit-nazwisko"
                  value={editFormData.nazwisko}
                  onChange={(e) => setEditFormData({ ...editFormData, nazwisko: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-telefon">Telefon</Label>
                <Input
                  id="edit-telefon"
                  value={editFormData.telefon}
                  onChange={(e) => setEditFormData({ ...editFormData, telefon: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                <Input
                  id="edit-whatsapp"
                  value={editFormData.whatsapp}
                  onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-messenger">Messenger</Label>
                <Input
                  id="edit-messenger"
                  value={editFormData.messenger}
                  onChange={(e) => setEditFormData({ ...editFormData, messenger: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-szkola">Szkoła</Label>
                <Input
                  id="edit-szkola"
                  value={editFormData.szkola}
                  onChange={(e) => setEditFormData({ ...editFormData, szkola: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-klasa">Klasa</Label>
                <Input
                  id="edit-klasa"
                  value={editFormData.klasa}
                  onChange={(e) => setEditFormData({ ...editFormData, klasa: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notatki">Notatki</Label>
              <Textarea
                id="edit-notatki"
                value={editFormData.notatki}
                onChange={(e) => setEditFormData({ ...editFormData, notatki: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" className="bg-green-500 hover:bg-green-600">
                Zapisz zmiany
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
