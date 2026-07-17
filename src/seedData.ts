import { JobApplication } from "./types";

// Current date is 2026-07-02.
// We'll calculate dates relative to 2026-07-02 to keep the seed data consistent.
export const SEED_APPLICATIONS: JobApplication[] = [
  {
    id: "seed-1",
    company: "Google",
    role: "Software Engineer III",
    location: "Mountain View, CA (Hybrid)",
    salaryRange: "₹24,00,000 - ₹36,00,000",
    dateApplied: "2026-06-27", // 5 days ago
    deadline: "2026-07-15",
    source: "LinkedIn",
    url: "https://careers.google.com/jobs/results/software-engineer-3",
    notes: "Direct referral from Sarah. Focused on cloud systems and Go/C++. Prepared for coding rounds.",
    status: "Applied",
    statusChangedAt: "2026-06-27T10:00:00.000Z"
  },
  {
    id: "seed-2",
    company: "Meta",
    role: "Senior Frontend Engineer",
    location: "Menlo Park, CA (Remote)",
    salaryRange: "₹35,00,000 - ₹55,00,000",
    dateApplied: "2026-06-16", // 16 days ago
    deadline: "2026-07-10",
    source: "Referral",
    url: "https://www.metacareers.com/jobs/senior-frontend",
    notes: "Recruiter reached out on LinkedIn. Finished initial screening. Waiting for technical screen details. No status update in 16 days—needs active follow-up.",
    status: "OA/Screening",
    statusChangedAt: "2026-06-16T14:30:00.000Z" // 16 days ago, triggers "Needs Follow-Up" (14+ days)
  },
  {
    id: "seed-3",
    company: "Vercel",
    role: "Full Stack Engineer",
    location: "San Francisco, CA (Remote)",
    salaryRange: "₹28,00,000 - ₹42,00,000",
    dateApplied: "2026-06-14", // 18 days ago
    deadline: "2026-07-04", // 2 days from now (July 2, 2026). Triggers the "deadline flag"!
    source: "Company Website",
    url: "https://vercel.com/careers/full-stack-engineer",
    notes: "Next round is a technical walkthrough of Next.js architecture on July 4th. Critical deadline flag triggered.",
    status: "Interview",
    statusChangedAt: "2026-06-22T09:15:00.000Z" // 10 days ago
  }
];
