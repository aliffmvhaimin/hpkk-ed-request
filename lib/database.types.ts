export type AppRole = "staff" | "admin";
export type ImportStatus = "pending_review" | "resolved" | "ignored";
export type ImportTargetTable =
  | "profiles"
  | "weekly_request_groups"
  | "request_entries"
  | "request_entry_codes";

export type Profile = {
  id: string;
  username: string;
  username_display: string;
  display_name: string;
  role: AppRole;
  role_name: string;
  workbook_order: number | null;
  must_change_password: boolean;
  is_active: boolean;
  can_edit_requests: boolean;
  created_at: string;
  updated_at: string;
};

export type CalendarDateRemark = { remark_date: string; remark: string; updated_by: string; created_at: string; updated_at: string };

export type WeeklyRequestGroup = {
  id: string;
  owner_id: string;
  week_start: string;
  remark: string;
  source: "app" | "xlsx_import";
  created_at: string;
  updated_at: string;
};

export type RequestEntry = {
  id: string;
  group_id: string;
  owner_id: string;
  request_date: string;
  created_at: string;
  updated_at: string;
};
