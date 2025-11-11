import { z } from 'zod';

export const paymentSchema = z.object({
  data_platnosci: z.string({
    required_error: 'Data płatności jest wymagana',
  }).min(1, 'Data płatności jest wymagana'),
  
  kwota: z.string({
    required_error: 'Kwota jest wymagana',
  })
    .min(1, 'Kwota jest wymagana')
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Kwota musi być liczbą',
    })
    .refine((val) => parseFloat(val) > 0, {
      message: 'Kwota musi być większa od zera',
    }),
  
  waluta: z.string().default('PLN'),
  
  metoda: z.string().optional(),
  
  status: z.enum(['oczekuje', 'zapłacone', 'zaległe', 'anulowane'], {
    required_error: 'Status jest wymagany',
  }),
  
  notatki: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
