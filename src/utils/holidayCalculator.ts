/**
 * Utilitário para calcular feriados móveis brasileiros
 * Baseado no cálculo da Páscoa (algoritmo de Meeus/Jones/Butcher)
 */

/**
 * Calcula a data da Páscoa para um determinado ano
 * Algoritmo de Meeus/Jones/Butcher (funciona para anos 1583-4099)
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Calcula a data da Sexta-feira Santa (2 dias antes da Páscoa)
 */
function calculateGoodFriday(year: number): Date {
  const easter = calculateEaster(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  return goodFriday;
}

/**
 * Calcula a data do Carnaval (47 dias antes da Páscoa)
 * Retorna a terça-feira de Carnaval
 */
function calculateCarnival(year: number): Date {
  const easter = calculateEaster(year);
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 47);
  return carnival;
}

/**
 * Calcula a data da Segunda-feira de Carnaval (48 dias antes da Páscoa)
 */
function calculateCarnivalMonday(year: number): Date {
  const easter = calculateEaster(year);
  const carnivalMonday = new Date(easter);
  carnivalMonday.setDate(easter.getDate() - 48);
  return carnivalMonday;
}

/**
 * Calcula a data de Corpus Christi (60 dias após a Páscoa)
 */
function calculateCorpusChristi(year: number): Date {
  const easter = calculateEaster(year);
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  return corpusChristi;
}

/**
 * Retorna todos os feriados móveis para um determinado ano
 */
interface MovableHoliday {
  name: string;
  date: Date;
  type: 'nacional';
  is_recurring: boolean;
}

export function getMovableHolidays(year: number): MovableHoliday[] {
  return [
    {
      name: 'Segunda-feira de Carnaval',
      date: calculateCarnivalMonday(year),
      type: 'nacional',
      is_recurring: false
    },
    {
      name: 'Carnaval',
      date: calculateCarnival(year),
      type: 'nacional',
      is_recurring: false
    },
    {
      name: 'Sexta-feira Santa',
      date: calculateGoodFriday(year),
      type: 'nacional',
      is_recurring: false
    },
    {
      name: 'Corpus Christi',
      date: calculateCorpusChristi(year),
      type: 'nacional',
      is_recurring: false
    }
  ];
}

/**
 * Formata uma data no formato ISO (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica se uma data é final de semana
 */
function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado
}

/**
 * Verifica se uma data é sábado
 */
function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}

/**
 * Verifica se uma data é domingo
 */
function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}
