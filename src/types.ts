export type JobStatus = "Wishlist" | "Saved" | "Applied" | "OA/Screening" | "Interview" | "Offer" | "Rejected" | "Selected";

export type JobSource = "LinkedIn" | "Company Website" | "Referral" | "Other";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  salaryRange: string;
  dateApplied: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD or empty string
  source: JobSource;
  customSource?: string;
  url: string;
  notes: string;
  status: JobStatus;
  statusChangedAt: string; // ISO string of when status last changed
  suggestedKeywords?: string[];
  atsSuggestions?: string[];
}

export type SortField = "dateApplied" | "deadline" | "status";
export type SortOrder = "asc" | "desc";
