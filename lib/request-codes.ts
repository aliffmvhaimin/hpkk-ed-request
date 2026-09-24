export const REQUEST_CODES = [
  { code: "PG", meaningMs: "pagi", displayOrder: 10 },
  { code: "PTG", meaningMs: "petang", displayOrder: 20 },
  { code: "MLM", meaningMs: "malam", displayOrder: 30 },
  { code: "KM", meaningMs: "kelepasan malam", displayOrder: 40 },
  { code: "HK", meaningMs: "hari kelepasan", displayOrder: 50 },
  { code: "CT", meaningMs: "cuti", displayOrder: 60 },
  { code: "K", meaningMs: "kursus", displayOrder: 70 },
  { code: "HKA", meaningMs: "hari kelepasan am", displayOrder: 80 },
  { code: "HKO", meaningMs: "hari kelepasan owing", displayOrder: 90 },
] as const;

export type RequestCode = (typeof REQUEST_CODES)[number]["code"];
