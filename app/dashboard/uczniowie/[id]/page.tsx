'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MessageCircle, School, UserCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ZajeciaTab } from '@/components/zajecia-tab';
import { PlatnosciTab } from '@/components/platnosci-tab';
import { PrzegladTab } from '@/components/przeglad-tab';
import { usePermissions } from '@/hooks/use-permissions';

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
  created_by: string;
}

interface TutorInfo {
  full_name: string | null;
  email: string | null;
}

interface GuardianInfo {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [tutorInfo, setTutorInfo] = useState<TutorInfo | null>(null);
  const [guardians, setGuardians] = useState<GuardianInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { role, isAdminOrKonsultant } = usePermissions();

  useEffect(() => {
    loadStudent();
  }, [studentId, role]);

  const loadStudent = async () => {
    const { data, error } = await supabase
      .from('uczniowie')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (!error && data) {
      setStudent(data);

      if (isAdminOrKonsultant || role === 'opiekun') {
        const { data: tutorData } = await supabase
          .from('user_profiles')
          .select('full_name, user_id')
          .eq('user_id', data.created_by)
          .maybeSingle();

        if (tutorData) {
          const { data: authData } = await supabase.auth.admin.getUserById(tutorData.user_id);
          setTutorInfo({
            full_name: tutorData.full_name,
            email: authData.user?.email || null,
          });
        }
      }

      if (isAdminOrKonsultant) {
        const { data: guardianData } = await supabase
          .from('student_guardians')
          .select(`
            id,
            guardian_user_id,
            user_profiles!student_guardians_guardian_user_id_fkey(
              full_name,
              user_id
            )
          `)
          .eq('student_id', studentId);

        if (guardianData && guardianData.length > 0) {
          const guardiansWithEmail = await Promise.all(
            guardianData.map(async (g: any) => {
              const { data: authData } = await supabase.auth.admin.getUserById(g.guardian_user_id);
              return {
                id: g.id,
                full_name: g.user_profiles?.full_name || null,
                email: authData.user?.email || null,
              };
            })
          );
          setGuardians(guardiansWithEmail);
        }
      }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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

        <div className="space-y-6">
          {(isAdminOrKonsultant || role === 'opiekun') && tutorInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                  Nauczyciel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {tutorInfo.full_name || 'Nieznany'}
                    </p>
                    {tutorInfo.email && (
                      <p className="text-sm text-gray-500">{tutorInfo.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isAdminOrKonsultant && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Opiekunowie
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {guardians.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guardians.length === 0 ? (
                  <p className="text-sm text-gray-500">Brak przypisanych opiekunów</p>
                ) : (
                  <div className="space-y-3">
                    {guardians.map((guardian) => (
                      <div key={guardian.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          {guardian.full_name || 'Nieznany'}
                        </p>
                        {guardian.email && (
                          <p className="text-xs text-gray-500 mt-1">{guardian.email}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {role === 'opiekun' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Twoja rola</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Jesteś przypisany jako opiekun tego ucznia
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
