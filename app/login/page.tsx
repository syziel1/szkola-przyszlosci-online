'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: 'Błąd logowania',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSent(true);
      toast({
        title: 'Link wysłany!',
        description: 'Sprawdź swoją skrzynkę email',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-gray-800" />
          </div>
          <CardTitle className="text-2xl">Baza Uczniów</CardTitle>
          <CardDescription>
            System zarządzania dla korepetytora
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Twój email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Wysyłanie...' : 'Wyślij link logowania'}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Otrzymasz email z linkiem do logowania
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 text-green-800 rounded-lg">
                <p className="font-medium">Email wysłany!</p>
                <p className="text-sm mt-1">Sprawdź swoją skrzynkę i kliknij w link aby się zalogować.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
              >
                Wyślij ponownie
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
