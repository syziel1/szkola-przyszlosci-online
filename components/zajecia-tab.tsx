'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Calendar, Clock } from 'lucide-react';
import { format, addHours, addWeeks } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useClasses } from '@/hooks/use-classes';
import { classSchema, type ClassFormData } from '@/schemas/class.schema';

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

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      subject: 'matematyka',
      date: getTodayDate(),
      start_time: getDefaultStartTime(),
      end_time: getDefaultEndTime(getDefaultStartTime()),
      temat: '',
      zrozumienie: '',
      trudnosci: '',
      praca_domowa: '',
      status_pd: 'brak',
      is_recurring: false,
      recurring_weeks: '4',
    },
  });

  // Watch for start_time changes to update end_time
  const startTime = form.watch('start_time');
  const isRecurring = form.watch('is_recurring');
  const { setValue } = form;

  useEffect(() => {
    if (startTime) {
      const endTime = getDefaultEndTime(startTime);
      setValue('end_time', endTime);
    }
  }, [startTime]);

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

  const handleSubmit = async (values: ClassFormData) => {
    // Combine date and time for start_at
    const startDateTime = `${values.date}T${values.start_time}:00`;
    const endDateTime = values.end_time ? `${values.date}T${values.end_time}:00` : null;

    try {
      if (values.is_recurring) {
        // Create recurring classes
        const weeksCount = parseInt(values.recurring_weeks || '0');
        
        const promises = [];
        
        for (let week = 0; week < weeksCount; week++) {
          const weekDate = addWeeks(new Date(values.date), week);
          const weekStartDateTime = `${format(weekDate, 'yyyy-MM-dd')}T${values.start_time}:00`;
          const weekEndDateTime = values.end_time ? `${format(weekDate, 'yyyy-MM-dd')}T${values.end_time}:00` : null;
          
          promises.push(addClass({
            student_id: studentId,
            subject: values.subject,
            start_at: weekStartDateTime,
            end_at: weekEndDateTime,
            temat: values.temat || null,
            zrozumienie: values.zrozumienie ? parseInt(values.zrozumienie) : null,
            trudnosci: values.trudnosci || null,
            praca_domowa: values.praca_domowa || null,
            status_pd: values.status_pd,
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
          subject: values.subject,
          start_at: startDateTime,
          end_at: endDateTime,
          temat: values.temat || null,
          zrozumienie: values.zrozumienie ? parseInt(values.zrozumienie) : null,
          trudnosci: values.trudnosci || null,
          praca_domowa: values.praca_domowa || null,
          status_pd: values.status_pd,
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
      form.reset({
        subject: 'matematyka',
        date: getTodayDate(),
        start_time: getDefaultStartTime(),
        end_time: getDefaultEndTime(getDefaultStartTime()),
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Przedmiot *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="matematyka">Matematyka</SelectItem>
                          <SelectItem value="fizyka">Fizyka</SelectItem>
                          <SelectItem value="informatyka">Informatyka</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data zajęć *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Godzina rozpoczęcia *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {generateTimeOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Godzina zakończenia</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {generateTimeOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="is_recurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Zajęcia cykliczne (co tydzień)</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  {isRecurring && (
                    <FormField
                      control={form.control}
                      name="recurring_weeks"
                      render={({ field }) => (
                        <FormItem className="ml-6">
                          <FormLabel>Liczba tygodni</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="2">2 tygodnie</SelectItem>
                              <SelectItem value="4">4 tygodnie</SelectItem>
                              <SelectItem value="6">6 tygodni</SelectItem>
                              <SelectItem value="8">8 tygodni</SelectItem>
                              <SelectItem value="12">12 tygodni</SelectItem>
                              <SelectItem value="16">16 tygodni</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="temat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temat zajęć</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zrozumienie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poziom zrozumienia (1-5)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz poziom" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Bardzo słabe</SelectItem>
                          <SelectItem value="2">2 - Słabe</SelectItem>
                          <SelectItem value="3">3 - Średnie</SelectItem>
                          <SelectItem value="4">4 - Dobre</SelectItem>
                          <SelectItem value="5">5 - Bardzo dobre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trudnosci"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trudności</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="praca_domowa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Praca domowa</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status_pd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status pracy domowej</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="brak">Brak</SelectItem>
                          <SelectItem value="zadane">Zadane</SelectItem>
                          <SelectItem value="oddane">Oddane</SelectItem>
                          <SelectItem value="poprawa">Poprawa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Anuluj
                  </Button>
                  <Button type="submit" className="bg-green-500 hover:bg-green-600">
                    {isRecurring ? `Dodaj ${form.watch('recurring_weeks') || '4'} zajęć` : 'Dodaj zajęcia'}
                  </Button>
                </div>
              </form>
            </Form>
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
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
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
