import { z } from 'zod';

export const studentSchema = z.object({
  imie: z.string({
    required_error: 'Imię jest wymagane',
  }).min(1, 'Imię jest wymagane').min(2, 'Imię musi mieć co najmniej 2 znaki'),
  
  nazwisko: z.string({
    required_error: 'Nazwisko jest wymagane',
  }).min(1, 'Nazwisko jest wymagane').min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
  
  email: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Nieprawidłowy format adresu email',
    }),
  
  telefon: z.string().optional(),
  
  whatsapp: z.string().optional(),
  
  messenger: z.string().optional(),
  
  szkola: z.string().optional(),
  
  klasa: z.string().optional(),
  
  notatki: z.string().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;
