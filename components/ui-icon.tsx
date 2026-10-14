const paths = {
  calendar: "M8 3v4m8-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 4 2-1-2-4-2 1-2-1V4H8v3L6 8 4 7l-2 4 2 1v2l-2 1 2 4 2-1 2 1v3h8v-3l2-1 2 1 2-4-2-1v-2Z",
  logout: "M9 5H5v14h4m4-14 7 7-7 7M8 12h12",
  back: "M20 12H4m6-6-6 6 6 6",
};

export function UiIcon({ name }: { name: keyof typeof paths }) {
  return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
