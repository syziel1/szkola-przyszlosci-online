import { z } from 'zod';

export const studentSchema = z.object({
  imie: z.string({
    required_error: 'Imię jest wymagane',
  }).min(2, 'Imię musi mieć co najmniej 2 znaki'),
  
  nazwisko: z.string({
    required_error: 'Nazwisko jest wymagane',
  }).min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
  
  email: z.string()
    .email('Nieprawidłowy format adresu email')
    .optional()
    .or(z.literal('')),
  
  telefon: z.string().optional(),
  
  whatsapp: z.string().optional(),
  
  messenger: z.string().optional(),
  
  szkola: z.string().optional(),
  
  klasa: z.string().optional(),
  
  notatki: z.string().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;
