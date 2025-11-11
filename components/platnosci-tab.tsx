'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { paymentSchema, type PaymentFormData } from '@/schemas/payment.schema';

interface PlatnosciTabProps {
  studentId: string;
  studentName: string;
}

interface Payment {
  id: string;
  data_platnosci: string;
  kwota: number;
  waluta: string;
  metoda: string | null;
  status: string;
  notatki: string | null;
}

export function PlatnosciTab({ studentId, studentName }: PlatnosciTabProps) {
  const [platnosci, setPlatnosci] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      data_platnosci: format(new Date(), 'yyyy-MM-dd'),
      kwota: '',
      waluta: 'PLN',
      metoda: '',
      status: 'oczekuje',
      notatki: '',
    },
  });

  useEffect(() => {
    loadPlatnosci();
  }, [studentId]);

  const loadPlatnosci = async () => {
    const { data, error } = await supabase
      .from('platnosci')
      .select('*')
      .eq('student_id', studentId)
      .order('data_platnosci', { ascending: false });

    if (!error && data) {
      setPlatnosci(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (values: PaymentFormData) => {
    const kwotaValue = parseFloat(values.kwota);

    const { error } = await supabase.from('platnosci').insert([
      {
        student_id: studentId,
        data_platnosci: values.data_platnosci,
        kwota: kwotaValue,
        waluta: values.waluta,
        metoda: values.metoda || null,
        status: values.status,
        notatki: values.notatki || null,
      },
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
        description: 'Płatność została dodana',
      });
      setDialogOpen(false);
      form.reset({
        data_platnosci: format(new Date(), 'yyyy-MM-dd'),
        kwota: '',
        waluta: 'PLN',
        metoda: '',
        status: 'oczekuje',
        notatki: '',
      });
      loadPlatnosci();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      oczekuje: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      zapłacone: 'bg-green-100 text-green-800 border-green-300',
      zaległe: 'bg-red-100 text-red-800 border-red-300',
      anulowane: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totalPaid = platnosci
    .filter((p) => p.status === 'zapłacone')
    .reduce((sum, p) => sum + Number(p.kwota), 0);

  const totalPending = platnosci
    .filter((p) => p.status === 'oczekuje')
    .reduce((sum, p) => sum + Number(p.kwota), 0);

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <div className="text-sm text-green-600 font-medium">Zapłacone</div>
            <div className="text-xl font-bold text-green-800">{totalPaid.toFixed(2)} PLN</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <div className="text-sm text-yellow-600 font-medium">Oczekuje</div>
            <div className="text-xl font-bold text-yellow-800">{totalPending.toFixed(2)} PLN</div>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj płatność
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nowa płatność - {studentName}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_platnosci"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data płatności *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kwota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kwota *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="metoda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metoda płatności</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz metodę" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gotówka">Gotówka</SelectItem>
                            <SelectItem value="przelew">Przelew</SelectItem>
                            <SelectItem value="blik">BLIK</SelectItem>
                            <SelectItem value="karta">Karta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="oczekuje">Oczekuje</SelectItem>
                            <SelectItem value="zapłacone">Zapłacone</SelectItem>
                            <SelectItem value="zaległe">Zaległe</SelectItem>
                            <SelectItem value="anulowane">Anulowane</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notatki"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notatki</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Anuluj
                  </Button>
                  <Button type="submit" className="bg-green-500 hover:bg-green-600">
                    Dodaj płatność
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {platnosci.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Brak płatności</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {platnosci.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {Number(payment.kwota).toFixed(2)} {payment.waluta}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(payment.data_platnosci), 'd MMM yyyy', { locale: pl })}
                      </div>
                      {payment.metoda && (
                        <span>Metoda: {payment.metoda}</span>
                      )}
                    </div>
                    {payment.notatki && (
                      <p className="mt-2 text-sm text-gray-600">{payment.notatki}</p>
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
