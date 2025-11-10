'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useClasses } from '@/hooks/use-classes';

interface ZajeciaTabProps {
  studentId: string;
  studentName: string;
}

export function ZajeciaTab({ studentId, studentName }: ZajeciaTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { classes: zajecia, loading, addClass } = useClasses(studentId);

  const [formData, setFormData] = useState({
    subject: 'matematyka' as 'matematyka' | 'fizyka' | 'informatyka',
    start_at: '',
    end_at: '',
    temat: '',
    zrozumienie: '',
    trudnosci: '',
    praca_domowa: '',
    status_pd: 'brak' as 'brak' | 'zadane' | 'oddane' | 'poprawa',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await addClass({
      student_id: studentId,
      subject: formData.subject,
      start_at: formData.start_at,
      end_at: formData.end_at || null,
      temat: formData.temat || null,
      zrozumienie: formData.zrozumienie ? parseInt(formData.zrozumienie) : null,
      trudnosci: formData.trudnosci || null,
      praca_domowa: formData.praca_domowa || null,
      status_pd: formData.status_pd,
    });

    if (error) {
      toast({
        title: 'Błąd',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sukces',
        description: 'Zajęcia zostały dodane',
      });
      setDialogOpen(false);
      setFormData({
        subject: 'matematyka',
        start_at: '',
        end_at: '',
        temat: '',
        zrozumienie: '',
        trudnosci: '',
        praca_domowa: '',
        status_pd: 'brak',
      });
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      matematyka: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      fizyka: 'bg-green-100 text-green-800 border-green-300',
      informatyka: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[subject] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historia zajęć</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj zajęcia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nowe zajęcia - {studentName}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Przedmiot *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value: any) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matematyka">Matematyka</SelectItem>
                    <SelectItem value="fizyka">Fizyka</SelectItem>
                    <SelectItem value="informatyka">Informatyka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_at">Data i godzina rozpoczęcia *</Label>
                  <Input
                    id="start_at"
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_at">Data i godzina zakończenia</Label>
                  <Input
                    id="end_at"
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="temat">Temat zajęć</Label>
                <Input
                  id="temat"
                  value={formData.temat}
                  onChange={(e) => setFormData({ ...formData, temat: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="zrozumienie">Poziom zrozumienia (1-5)</Label>
                <Select
                  value={formData.zrozumienie}
                  onValueChange={(value) => setFormData({ ...formData, zrozumienie: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz poziom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Bardzo słabe</SelectItem>
                    <SelectItem value="2">2 - Słabe</SelectItem>
                    <SelectItem value="3">3 - Średnie</SelectItem>
                    <SelectItem value="4">4 - Dobre</SelectItem>
                    <SelectItem value="5">5 - Bardzo dobre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trudnosci">Trudności</Label>
                <Textarea
                  id="trudnosci"
                  value={formData.trudnosci}
                  onChange={(e) => setFormData({ ...formData, trudnosci: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="praca_domowa">Praca domowa</Label>
                <Textarea
                  id="praca_domowa"
                  value={formData.praca_domowa}
                  onChange={(e) => setFormData({ ...formData, praca_domowa: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="status_pd">Status pracy domowej</Label>
                <Select
                  value={formData.status_pd}
                  onValueChange={(value: any) => setFormData({ ...formData, status_pd: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brak">Brak</SelectItem>
                    <SelectItem value="zadane">Zadane</SelectItem>
                    <SelectItem value="oddane">Oddane</SelectItem>
                    <SelectItem value="poprawa">Poprawa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600">
                  Dodaj zajęcia
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {zajecia.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Brak zajęć</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {zajecia.map((zajecie) => (
            <Card key={zajecie.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSubjectColor(zajecie.subject)}`}>
                        {zajecie.subject}
                      </span>
                      {zajecie.zrozumienie && (
                        <span className="text-sm text-gray-600">
                          Zrozumienie: {zajecie.zrozumienie}/5
                        </span>
                      )}
                    </div>
                    {zajecie.temat && (
                      <p className="font-medium text-gray-900 mb-2">{zajecie.temat}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(zajecie.start_at), 'd MMM yyyy', { locale: pl })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(new Date(zajecie.start_at), 'HH:mm')}
                        {zajecie.end_at && ` - ${format(new Date(zajecie.end_at), 'HH:mm')}`}
                      </div>
                    </div>
                    {zajecie.praca_domowa && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <span className="font-medium">Praca domowa:</span> {zajecie.praca_domowa}
                        <span className="ml-2 text-xs text-gray-600">({zajecie.status_pd})</span>
                      </div>
                    )}
                    {zajecie.trudnosci && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                        <span className="font-medium">Trudności:</span> {zajecie.trudnosci}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
