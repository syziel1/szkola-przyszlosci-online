import { format, formatDistance, differenceInDays, isToday, isTomorrow, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

export function formatClassDateTime(dateString: string | null): string {
  if (!dateString) return 'Brak danych';

  try {
    const date = parseISO(dateString);
    return format(date, 'dd.MM.yyyy, HH:mm', { locale: pl });
  } catch {
    return 'Nieprawidłowa data';
  }
}

export function calculateDaysUntil(dateString: string | null): string {
  if (!dateString) return '';

  try {
    const date = parseISO(dateString);
    const now = new Date();

    if (isToday(date)) {
      return 'dziś';
    }

    if (isTomorrow(date)) {
      return 'jutro';
    }

    const days = differenceInDays(date, now);

    if (days < 0) {
      return '';
    }

    if (days === 1) {
      return 'za 1 dzień';
    }

    if (days >= 2 && days <= 4) {
      return `za ${days} dni`;
    }

    return `za ${days} dni`;
  } catch {
    return '';
  }
}

export function isClassToday(dateString: string | null): boolean {
  if (!dateString) return false;

  try {
    const date = parseISO(dateString);
    return isToday(date);
  } catch {
    return false;
  }
}

export function formatClassDateTimeWithCountdown(dateString: string | null): { dateTime: string; countdown: string; isToday: boolean } {
  return {
    dateTime: formatClassDateTime(dateString),
    countdown: calculateDaysUntil(dateString),
    isToday: isClassToday(dateString)
  };
}
