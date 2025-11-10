'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Clock } from 'lucide-react';
import { format, addHours, addWeeks } from 'date-fns';
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

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  // Helper function to round time to nearest 15 minutes
  const roundToNearest15Minutes = (date: Date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const roundedDate = new Date(date);
    roundedDate.setMinutes(roundedMinutes, 0, 0);
    return roundedDate;
  };

  // Helper function to get default start time (next 15-minute interval)
  const getDefaultStartTime = () => {
    const now = new Date();
    const rounded = roundToNearest15Minutes(now);
    return format(rounded, 'HH:mm');
  };

  // Helper function to get default end time (1 hour after start)
  const getDefaultEndTime = (startTime: string) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addHours(startDate, 1);
    return format(endDate, 'HH:mm');
  };

  const [formData, setFormData] = useState({
    subject: 'matematyka' as 'matematyka' | 'fizyka' | 'informatyka',
    date: getTodayDate(),
    start_time: getDefaultStartTime(),
    end_time: getDefaultEndTime(getDefaultStartTime()),
    end_at: '',
    temat: '',
    zrozumienie: '',
    trudnosci: '',
    praca_domowa: '',
    status_pd: 'brak' as 'brak' | 'zadane' | 'oddane' | 'poprawa',
    is_recurring: false,
    recurring_weeks: '4',
  });

  // Update end time when start time changes
  const handleStartTimeChange = (startTime: string) => {
    const endTime = getDefaultEndTime(startTime);
    setFormData(prev => ({
      ...prev,
      start_time: startTime,
      end_time: endTime
    }));
  };

  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time for start_at
    const startDateTime = `${formData.date}T${formData.start_time}:00`;
    const endDateTime = formData.end_time ? `${formData.date}T${formData.end_time}:00` : null;

    try {
      if (formData.is_recurring) {
        // Create recurring classes
        const weeksCount = parseInt(formData.recurring_weeks);
        
        // Validate weeks count
        if (isNaN(weeksCount) || weeksCount <= 0 || weeksCount > 52) {
          toast({
            title: 'Błąd',
            description: 'Liczba tygodni musi być liczbą od 1 do 52',
            variant: 'destructive',
          });
          return;
        }
        
        const promises = [];
        
        for (let week = 0; week < weeksCount; week++) {
          const weekDate = addWeeks(new Date(formData.date), week);
          const weekStartDateTime = `${format(weekDate, 'yyyy-MM-dd')}T${formData.start_time}:00`;
          const weekEndDateTime = formData.end_time ? `${format(weekDate, 'yyyy-MM-dd')}T${formData.end_time}:00` : null;
          
          promises.push(addClass({
            student_id: studentId,
            subject: formData.subject,
            start_at: weekStartDateTime,
            end_at: weekEndDateTime,
            temat: formData.temat || null,
            zrozumienie: formData.zrozumienie ? parseInt(formData.zrozumienie) : null,
            trudnosci: formData.trudnosci || null,
            praca_domowa: formData.praca_domowa || null,
            status_pd: formData.status_pd,
          }));
        }
        
        const results = await Promise.all(promises);
        const errors = results.filter(result => result.error);
        
        if (errors.length > 0) {
          toast({
            title: 'Błąd',
            description: `Nie udało się dodać ${errors.length} z ${weeksCount} zajęć`,
            variant: 'destructive',
          });
          return;
        }
        
        toast({
          title: 'Sukces',
          description: `Dodano ${weeksCount} cyklicznych zajęć`,
        });
      } else {
        // Create single class
        const { error } = await addClass({
          student_id: studentId,
          subject: formData.subject,
          start_at: startDateTime,
          end_at: endDateTime,
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
          return;
        }
        
        toast({
          title: 'Sukces',
          description: 'Zajęcia zostały dodane',
        });
      }

      // Reset form and close dialog
      setDialogOpen(false);
      setFormData({
        subject: 'matematyka',
        date: getTodayDate(),
        start_time: getDefaultStartTime(),
        end_time: getDefaultEndTime(getDefaultStartTime()),
        end_at: '',
        temat: '',
        zrozumienie: '',
        trudnosci: '',
        praca_domowa: '',
        status_pd: 'brak',
        is_recurring: false,
        recurring_weeks: '4',
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Wystąpił nieoczekiwany błąd',
        variant: 'destructive',
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
              <div>
                <Label htmlFor="date">Data zajęć *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Godzina rozpoczęcia *</Label>
                  <Select
                    value={formData.start_time}
                    onValueChange={handleStartTimeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {generateTimeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="end_time">Godzina zakończenia</Label>
                  <Select
                    value={formData.end_time}
                    onValueChange={(value) => setFormData({ ...formData, end_time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {generateTimeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_recurring: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_recurring">Zajęcia cykliczne (co tydzień)</Label>
                </div>
                {formData.is_recurring && (
                  <div className="ml-6">
                    <Label htmlFor="recurring_weeks">Liczba tygodni</Label>
                    <Select
                      value={formData.recurring_weeks}
                      onValueChange={(value) => setFormData({ ...formData, recurring_weeks: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 tygodnie</SelectItem>
                        <SelectItem value="4">4 tygodnie</SelectItem>
                        <SelectItem value="6">6 tygodni</SelectItem>
                        <SelectItem value="8">8 tygodni</SelectItem>
                        <SelectItem value="12">12 tygodni</SelectItem>
                        <SelectItem value="16">16 tygodni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                  {formData.is_recurring ? `Dodaj ${formData.recurring_weeks} zajęć` : 'Dodaj zajęcia'}
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
