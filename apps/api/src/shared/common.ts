export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type DocumentCategory =
  | "report_card"
  | "fee_receipt"
  | "id_document"
  | "medical_note"
  | "consent_form"
  | "certificate"
  | "assignment_attachment";

export type VisibilityScope =
  | "self"
  | "linked_parent"
  | "teacher_assigned"
  | "school_admin"
  | "finance_only"
  | "counselor_restricted";
