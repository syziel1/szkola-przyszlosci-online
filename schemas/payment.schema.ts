import { z } from 'zod';

export const paymentSchema = z.object({
  data_platnosci: z.string({
    required_error: 'Data płatności jest wymagana',
  }).min(1, 'Data płatności jest wymagana'),
  
  kwota: z.coerce.number({
    required_error: 'Kwota jest wymagana',
    invalid_type_error: 'Kwota musi być liczbą',
  }).positive('Kwota musi być większa od zera'),
  
  waluta: z.string().default('PLN'),
  
  metoda: z.string().optional(),
  
  status: z.enum(['oczekuje', 'zapłacone', 'zaległe', 'anulowane'], {
    required_error: 'Status jest wymagany',
  }),
  
  notatki: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
