import { z } from 'zod';

// Base schema with common fields
const baseClassSchema = z.object({
  subject: z.enum(['matematyka', 'fizyka', 'informatyka'], {
    required_error: 'Przedmiot jest wymagany',
  }),
  
  date: z.string({
    required_error: 'Data jest wymagana',
  }).min(1, 'Data jest wymagana'),
  
  start_time: z.string({
    required_error: 'Godzina rozpoczęcia jest wymagana',
  }).min(1, 'Godzina rozpoczęcia jest wymagana'),
  
  end_time: z.string().optional(),
  
  temat: z.string().optional(),
  
  zrozumienie: z.string().optional(),
  
  trudnosci: z.string().optional(),
  
  praca_domowa: z.string().optional(),
  
  status_pd: z.enum(['brak', 'zadane', 'oddane', 'poprawa'], {
    required_error: 'Status pracy domowej jest wymagany',
  }),
});

// Discriminated union for recurring vs non-recurring classes
export const classSchema = z.discriminatedUnion('is_recurring', [
  // Non-recurring class
  baseClassSchema.extend({
    is_recurring: z.literal(false),
  }),
  // Recurring class
  baseClassSchema.extend({
    is_recurring: z.literal(true),
    recurring_weeks: z.coerce.number().int().min(1, 'Liczba tygodni musi być większa niż 0').max(52, 'Liczba tygodni nie może być większa niż 52'),
  }),
]);

export type ClassFormData = z.infer<typeof classSchema>;
