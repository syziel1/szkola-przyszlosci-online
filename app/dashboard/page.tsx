'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, Clock, User } from 'lucide-react';

interface Zajecie {
  id: string;
  start_at: string;
  end_at: string | null;
  temat: string | null;
  subject: string;
  student_id: string;
  uczniowie: {
    imie: string;
    nazwisko: string;
  };
}

export default function DashboardPage() {
  const [zajecia, setZajecia] = useState<Zajecie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZajecia();
  }, []);

  const loadZajecia = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('zajecia')
      .select('*, uczniowie(imie, nazwisko)')
      .gte('start_at', today.toISOString())
      .order('start_at', { ascending: true })
      .limit(10);

    if (!error && data) {
      setZajecia(data as any);
    }
    setLoading(false);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kokpit Nauczyciela</h1>
        <p className="text-gray-600 mt-2">Nadchodzące zajęcia</p>
      </div>

      {zajecia.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Brak zaplanowanych zajęć</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {zajecia.map((zajecie) => (
            <Card key={zajecie.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSubjectColor(zajecie.subject)}`}>
                        {zajecie.subject}
                      </span>
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        <span className="font-medium">
                          {zajecie.uczniowie.imie} {zajecie.uczniowie.nazwisko}
                        </span>
                      </div>
                    </div>
                    {zajecie.temat && (
                      <p className="text-gray-900 font-medium mb-2">{zajecie.temat}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(zajecie.start_at), 'EEEE, d MMMM yyyy', { locale: pl })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(new Date(zajecie.start_at), 'HH:mm')}
                        {zajecie.end_at && ` - ${format(new Date(zajecie.end_at), 'HH:mm')}`}
                      </div>
                    </div>
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
