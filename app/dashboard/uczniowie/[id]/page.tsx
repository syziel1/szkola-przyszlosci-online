'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, MessageCircle, School, Edit } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ZajeciaTab } from '@/components/zajecia-tab';
import { PlatnosciTab } from '@/components/platnosci-tab';
import { PrzegladTab } from '@/components/przeglad-tab';

interface Student {
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
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    const { data, error } = await supabase
      .from('uczniowie')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (!error && data) {
      setStudent(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  if (!student) {
    return <div className="text-center py-12">Nie znaleziono ucznia</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/uczniowie">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {student.imie} {student.nazwisko}
            </h1>
            {student.szkola && (
              <p className="text-gray-600 mt-1 flex items-center">
                <School className="w-4 h-4 mr-2" />
                {student.szkola} {student.klasa && `- Klasa ${student.klasa}`}
              </p>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.email && (
              <div className="flex items-center space-x-3 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400" />
                <span>{student.email}</span>
              </div>
            )}
            {student.telefon && (
              <div className="flex items-center space-x-3 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{student.telefon}</span>
              </div>
            )}
            {student.whatsapp && (
              <div className="flex items-center space-x-3 text-gray-700">
                <MessageCircle className="w-5 h-5 text-green-500" />
                <span>WhatsApp: {student.whatsapp}</span>
              </div>
            )}
            {student.messenger && (
              <div className="flex items-center space-x-3 text-gray-700">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span>Messenger: {student.messenger}</span>
              </div>
            )}
          </div>
          {student.notatki && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Notatki:</p>
              <p className="text-gray-600 whitespace-pre-wrap">{student.notatki}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="przeglad" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="przeglad">Przegląd</TabsTrigger>
          <TabsTrigger value="zajecia">Zajęcia</TabsTrigger>
          <TabsTrigger value="platnosci">Płatności</TabsTrigger>
        </TabsList>

        <TabsContent value="przeglad">
          <PrzegladTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="zajecia">
          <ZajeciaTab studentId={studentId} studentName={`${student.imie} ${student.nazwisko}`} />
        </TabsContent>

        <TabsContent value="platnosci">
          <PlatnosciTab studentId={studentId} studentName={`${student.imie} ${student.nazwisko}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
