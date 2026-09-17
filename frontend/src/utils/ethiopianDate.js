// frontend/src/utils/ethiopianDate.js
//
// Convert between Gregorian and Ethiopian calendar dates.
//
// The Ethiopian calendar has 13 months: 12 months of 30 days plus a
// 13th month (Pagumē) with 5 or 6 days. Ethiopian New Year (1 Meskerem)
// falls on 11 September in common Gregorian years and on 12 September
// when the following Gregorian year is a leap year.
//
// This is a self-contained implementation — no external package needed.

const ETHIOPIAN_MONTHS = [
  "መስከረም", // Meskerem
  "ጥቅምት", // Tikimt
  "ኅዳር", // Hidar
  "ታኅሣሥ", // Tahsas
  "ጥር", // Tir
  "የካቲት", // Yekatit
  "መጋቢት", // Megabit
  "ሚያዝያ", // Miazia
  "ግንቦት", // Ginbot
  "ሰኔ", // Sene
  "ሐምሌ", // Hamle
  "ነሐሴ", // Nehase
  "ጳጉሜ", // Pagumē
];

const ETHIOPIAN_MONTHS_TRANSLIT = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagume",
];

/**
 * Convert a Gregorian date to Ethiopian calendar components.
 * @param {Date|string} gregorianDate
 * @returns {{ year: number, month: number, day: number }}
 */
export function toEthiopian(gregorianDate) {
  const d = new Date(gregorianDate);
  const gy = d.getFullYear();

  // Ethiopian new year offset:
  //   Gregorian date of 1 Meskerem is Sep 11 (or Sep 12 when the
  //   upcoming Gregorian year is a leap year — every 4 years).
  //
  // We compute this by comparing the given Gregorian date against the
  // start of the current Ethiopian year (Sep 11/12 of the current or
  // previous Gregorian year).
  const gregorianStartOfEthYear = new Date(gy, 8, 11); // Sep 11 of this year
  // Leap year adjustment: Ethiopian new year shifts to Sep 12 when
  // the *next* Gregorian year is a leap year.
  const nextYear = gy + 1;
  const isNextGregLeap =
    (nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0;
  if (isNextGregLeap) gregorianStartOfEthYear.setDate(12);

  let ethYear;
  let dayOfEthYear; // days since 1 Meskerem (0-based)

  if (d >= gregorianStartOfEthYear) {
    // In the Ethiopian year that started this Gregorian year.
    ethYear = gy - 7;
    dayOfEthYear = Math.floor((d - gregorianStartOfEthYear) / 86400000);
  } else {
    // In the Ethiopian year that started last Gregorian year.
    const prevStart = new Date(gy - 1, 8, 11);
    const wasPrevNextLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
    if (wasPrevNextLeap) prevStart.setDate(12);

    ethYear = gy - 8;
    dayOfEthYear = Math.floor((d - prevStart) / 86400000);
  }

  // Ethiopian leap year: the year preceding a Gregorian leap year.
  const isEthiopianLeap = (ethYear + 1) % 4 === 0;

  // Month/day within the Ethiopian year
  const month = Math.floor(dayOfEthYear / 30) + 1; // 1-13
  const day = (dayOfEthYear % 30) + 1;

  // Sanity: if we landed on month 13 with day > 5/6, push into next year.
  const maxDayIn13th = isEthiopianLeap ? 6 : 5;
  if (month === 13 && day > maxDayIn13th) {
    return { year: ethYear + 1, month: 1, day: day - maxDayIn13th };
  }

  return { year: ethYear, month, day };
}

/**
 * Format a Gregorian date as an Ethiopian calendar string.
 * @param {Date|string} gregorianDate
 * @param {"am"|"translit"} lang — "am" for Amharic month names, "translit" for Latin
 * @returns {string} e.g. "ጥቅምት 12, 2019 ዓ.ም." or "Tikimt 12, 2019"
 */
export function formatEthiopianDate(gregorianDate, lang = "am") {
  if (!gregorianDate) return "";
  const d =
    gregorianDate instanceof Date ? gregorianDate : new Date(gregorianDate);
  if (isNaN(d.getTime())) return "";

  const { year, month, day } = toEthiopian(d);
  const monthName =
    lang === "am"
      ? ETHIOPIAN_MONTHS[month - 1] || ETHIOPIAN_MONTHS_TRANSLIT[month - 1]
      : ETHIOPIAN_MONTHS_TRANSLIT[month - 1];

  if (lang === "am") {
    return `${monthName} ${day}, ${year} ዓ.ም.`;
  }
  return `${monthName} ${day}, ${year} E.C.`;
}

/**
 * Get today's Gregorian date in YYYY-MM-DD form, ready for an
 * <input type="date"> value.
 */
export function todayGregorianISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
