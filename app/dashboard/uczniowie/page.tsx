'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, User } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  imie: string;
  nazwisko: string;
  email: string | null;
  telefon: string | null;
  szkola: string | null;
  klasa: string | null;
}

export default function UczniwowiePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

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
    loadStudents();
  }, []);

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
    const { data, error } = await supabase
      .from('uczniowie')
      .select('*')
      .order('nazwisko', { ascending: true });

    if (!error && data) {
      setStudents(data);
      setFilteredStudents(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('uczniowie').insert([formData]);

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

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Uczniowie</h1>
          <p className="text-gray-600 mt-2">Lista wszystkich uczniów</p>
        </div>
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
            <p>Brak uczniów</p>
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
