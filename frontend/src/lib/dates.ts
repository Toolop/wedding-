export function parseDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const MONTH_WORDS: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agt: 7, agustus: 7, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oktober: 9, oct: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11, december: 11,
};

/** admin dates are free text: "Januari 2020", "14 Feb 2021", "2022-06-01", "2019" */
export function parseLooseDate(value: string): Date | null {
  const v = value.trim().toLowerCase();
  if (/^\d{4}-\d{2}/.test(v)) return parseDate(v);
  const m = v.match(/(?:(\d{1,2})\s+)?([a-z]+)\.?\s+(\d{4})/);
  if (m && Object.hasOwn(MONTH_WORDS, m[2])) {
    return new Date(Number(m[3]), MONTH_WORDS[m[2]], m[1] ? Number(m[1]) : 1);
  }
  const y = v.match(/\b(\d{4})\b/);
  return y ? new Date(Number(y[1]), 0, 1) : null;
}
