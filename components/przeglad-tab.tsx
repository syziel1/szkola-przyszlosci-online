'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign } from 'lucide-react';

interface PrzegladTabProps {
  studentId: string;
}

export function PrzegladTab({ studentId }: PrzegladTabProps) {
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalPayments: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [studentId]);

  const loadStats = async () => {
    const [lessonsResult, paymentsResult, pendingResult] = await Promise.all([
      supabase.from('zajecia').select('id', { count: 'exact', head: true }).eq('student_id', studentId),
      supabase.from('platnosci').select('kwota').eq('student_id', studentId).eq('status', 'zapłacone'),
      supabase.from('platnosci').select('kwota').eq('student_id', studentId).eq('status', 'oczekuje'),
    ]);

    const totalLessons = lessonsResult.count || 0;
    const totalPayments = paymentsResult.data?.reduce((sum, p) => sum + Number(p.kwota), 0) || 0;
    const pendingPayments = pendingResult.data?.reduce((sum, p) => sum + Number(p.kwota), 0) || 0;

    setStats({ totalLessons, totalPayments, pendingPayments });
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Liczba zajęć</CardTitle>
          <Calendar className="w-4 h-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLessons}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Suma płatności</CardTitle>
          <DollarSign className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPayments.toFixed(2)} PLN</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Oczekujące płatności</CardTitle>
          <DollarSign className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingPayments.toFixed(2)} PLN</div>
        </CardContent>
      </Card>
    </div>
  );
}
