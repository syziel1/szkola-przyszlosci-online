import { z } from 'zod';

export const classSchema = z.object({
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
  
  zrozumienie: z.coerce.number().min(1, 'Zrozumienie musi być od 1 do 5').max(5, 'Zrozumienie musi być od 1 do 5').optional(),
  
  trudnosci: z.string().optional(),
  
  praca_domowa: z.string().optional(),
  
  status_pd: z.enum(['brak', 'zadane', 'oddane', 'poprawa'], {
    required_error: 'Status pracy domowej jest wymagany',
  }),
  
  is_recurring: z.boolean().default(false),
  
  recurring_weeks: z.string().optional(),
}).refine((data) => {
  // If recurring is enabled, validate recurring_weeks
  if (data.is_recurring) {
    if (!data.recurring_weeks || data.recurring_weeks === '') {
      return false;
    }
    const weeks = parseInt(data.recurring_weeks);
    return !isNaN(weeks) && weeks > 0 && weeks <= 52;
  }
  return true;
}, {
  message: 'Liczba tygodni musi być liczbą od 1 do 52',
  path: ['recurring_weeks'],
});

export type ClassFormData = z.infer<typeof classSchema>;
