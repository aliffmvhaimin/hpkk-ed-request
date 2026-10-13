export const STAFF_ROLE_NAMES = [
  "JURURAWAT TERLATIH",
  "PENOLONG PEGAWAI PERUBATAN",
  "PEMBANTU PERAWATAN KESIHATAN",
] as const;

export const REQUEST_DISPLAY_ROLE_NAMES = [
  "JURURAWAT TERLATIH",
  "PEMBANTU PERAWATAN KESIHATAN",
] as const;

export type StaffRoleName = (typeof STAFF_ROLE_NAMES)[number];

export function isStaffRoleName(value: string): value is StaffRoleName {
  return STAFF_ROLE_NAMES.includes(value as StaffRoleName);
}
