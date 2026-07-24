import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  Plus,
  Clipboard,
  Kanban,
  Table as TableIcon,
  TrendingUp,
  AlertTriangle,
  Trash2,
  Edit,
  Calendar,
  ClipboardPaste,
  DollarSign,
  IndianRupee,
  User,
  LogOut,
  MapPin,
  ExternalLink,
  X,
  Search,
  ArrowUpDown,
  Check,
  BadgeCheck,
  Clock,
  Sparkles,
  Loader2,
  ChevronDown,
  Filter,
  CheckCircle,
  FileText,
  MoreVertical,
  Download,
  Upload,
  Share2,
  EyeOff,
  Laptop,
  Bell,
  Sun,
  Moon,
  Bookmark,
  Heart,
  Tag,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  FileCheck,
  FileDown,
  Notebook,
  Pin,
  FolderHeart,
  FolderGit
} from "lucide-react";
import { JobApplication, JobStatus, JobSource, SortField, SortOrder } from "./types";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { auth } from "./firebase";

// Today's date per additional metadata
const TODAY_DATE = "2026-07-02";

// Helper to calculate days since applied
function getDaysSince(dateStr: string): number {
  const today = new Date(`${TODAY_DATE}T00:00:00`);
  const applied = new Date(`${dateStr}T00:00:00`);
  const diffTime = today.getTime() - applied.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 0 : diffDays;
}

// Helper to check if a deadline is close (within 3 days or overdue) and not in a terminal state
function isDeadlineClose(app: JobApplication): boolean {
  if (!app.deadline) return false;
  if (app.status === "Offer" || app.status === "Rejected") return false;

  const today = new Date(`${TODAY_DATE}T00:00:00`);
  const deadline = new Date(`${app.deadline}T00:00:00`);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Within 3 days includes today, tomorrow, day after, and overdue/past deadlines that are still active
  return diffDays <= 3;
}

// Helper to check if application has no status change in 14+ days and is not in terminal status
function needsFollowUp(app: JobApplication): boolean {
  if (app.status === "Offer" || app.status === "Rejected") return false;
  const today = new Date(`${TODAY_DATE}T00:00:00`).getTime();
  const changed = new Date(app.statusChangedAt).getTime();
  const diffDays = (today - changed) / (1000 * 60 * 60 * 24);
  return diffDays >= 14;
}

// Helper to get suggested keywords for any job application
export function getKeywordsForApp(app: JobApplication): string[] {
  if (app.suggestedKeywords && app.suggestedKeywords.length > 0) {
    return app.suggestedKeywords;
  }
  const roleLower = app.role.toLowerCase();
  const companyLower = app.company.toLowerCase();

  if (roleLower.includes("frontend") || roleLower.includes("ui") || roleLower.includes("ux")) {
    return ["React", "JavaScript", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "Git", "Responsive Design", "Performance Optimization", "Figma"];
  }
  if (roleLower.includes("full stack") || roleLower.includes("fullstack") || companyLower.includes("vercel")) {
    return ["Next.js", "React", "Node.js", "TypeScript", "Tailwind CSS", "Serverless", "PostgreSQL", "Git", "REST APIs", "Vercel"];
  }
  if (roleLower.includes("software engineer") || roleLower.includes("backend") || companyLower.includes("google")) {
    return ["Go", "C++", "Google Cloud Platform", "Kubernetes", "Docker", "Algorithms", "System Design", "Git", "REST APIs", "Distributed Systems"];
  }
  return ["Project Management", "Agile Methodologies", "Team Collaboration", "Problem Solving", "Git", "Software Development Life Cycle (SDLC)", "API Integration"];
}

// Helper to get ATS suggestions for any job application
export function getAtsSuggestionsForApp(app: JobApplication): string[] {
  if (app.atsSuggestions && app.atsSuggestions.length > 0) {
    return app.atsSuggestions;
  }
  return [
    "Incorporate quantitative achievements in experience bullets to describe project impact (e.g., 'increased performance by 25%').",
    "Ensure proper technical term capitalization (e.g., 'React' instead of 'react', 'TypeScript' instead of 'typescript').",
    "Add standard section headers like 'Skills', 'Experience', and 'Education' so parsing systems identify them properly.",
    "Format experiences with clean month-year timelines and use standard fonts like Inter or Arial to avoid parsing issues."
  ];
}

// Helper to calculate score for a specific app given the resume text
export function calculateAtsScoreForApp(app: JobApplication, resumeText: string): number | null {
  const targetKeywords = getKeywordsForApp(app);
  if (targetKeywords.length === 0 || !resumeText.trim()) {
    return null;
  }
  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  targetKeywords.forEach(kw => {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(resumeLower) || resumeLower.includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  });
  return Math.round((matched.length / targetKeywords.length) * 100) || 0;
}

// Local keyword extractor based on an elite tech dictionary
export function extractKeywordsLocally(text: string): string[] {
  const dictionary = [
    "TypeScript", "JavaScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "SQL", "HTML5", "CSS3", "Sass",
    "React", "Vue", "Angular", "Next.js", "Tailwind CSS", "Redux", "Zustand", "Webpack", "Vite", "Responsive Design", "UI/UX", "Figma", "HTML", "CSS", "Bootstrap",
    "Node.js", "Express", "Django", "Flask", "Spring Boot", "GraphQL", "REST APIs", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase", "Firestore", "Prisma", "Drizzle",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git", "GitHub", "Vercel", "Netlify", "Heroku", "Cloudflare",
    "Agile", "Scrum", "Microservices", "Serverless", "Testing", "Jest", "Cypress", "Machine Learning", "Data Science", "API Integration"
  ];
  return dictionary.filter(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:\\b|\\s|^)${escaped}(?:\\b|\\s|$|\\.|,)`, 'i');
    return regex.test(text);
  });
}

// Guess target company and role from raw job descriptions
export function getSuggestedWeakBullet(desc: string) {
  if (!desc || !desc.trim()) {
    return "Worked on a web application development team.";
  }
  const lower = desc.toLowerCase();
  if (lower.includes("frontend") || lower.includes("react") || lower.includes("ui") || lower.includes("ux") || lower.includes("css") || lower.includes("javascript")) {
    return "Worked on React components, made some UI screens, and resolved front-end tickets.";
  }
  if (lower.includes("backend") || lower.includes("node") || lower.includes("python") || lower.includes("sql") || lower.includes("database") || lower.includes("api") || lower.includes("java") || lower.includes("go") || lower.includes("c++")) {
    return "Assisted in writing API endpoints, ran SQL database queries, and worked on server bugs.";
  }
  if (lower.includes("full stack") || lower.includes("fullstack")) {
    return "Helped with both frontend and backend tasks and maintained the main application.";
  }
  if (lower.includes("data") || lower.includes("analytics") || lower.includes("ml") || lower.includes("python")) {
    return "Helped with data analysis tasks, ran some Python scripts, and built simple data tables.";
  }
  return "Responsible for developing software application features and attending team meetings.";
}

export function guessCompanyAndRole(desc: string) {
  let role = "Software Engineer";
  let company = "Hiring Team";

  const roleRegexes = [
    /looking for a\s+([^.\n]{5,40})/i,
    /join our team as a\s+([^.\n]{5,40})/i,
    /Senior\s+[^.\n]{5,30}/i,
    /Staff\s+[^.\n]{5,30}/i,
    /Lead\s+[^.\n]{5,30}/i,
    /Developer/i,
    /Engineer/i,
    /Manager/i
  ];

  for (const r of roleRegexes) {
    const match = desc.match(r);
    if (match) {
      role = match[1]?.trim() || match[0];
      role = role.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
      break;
    }
  }

  const companyRegexes = [
    /at\s+([A-Z][a-zA-Z0-9\s]{2,20})\b/,
    /join\s+([A-Z][a-zA-Z0-9\s]{2,20})\b/,
    /about\s+([A-Z][a-zA-Z0-9\s]{2,20})\b/
  ];
  for (const r of companyRegexes) {
    const match = desc.match(r);
    if (match && !/join our|join the|join us/i.test(match[1])) {
      company = match[1]?.trim();
      break;
    }
  }

  return { role, company };
}

const COLUMNS: { status: JobStatus; title: string; color: string; bg: string; border: string; text: string; lightBg: string }[] = [
  { status: "Wishlist", title: "Wishlist", color: "bg-amber-500", bg: "bg-amber-50/40", border: "border-amber-100", text: "text-amber-600", lightBg: "bg-amber-50" },
  { status: "Saved", title: "Saved Jobs", color: "bg-indigo-400", bg: "bg-indigo-50/40", border: "border-indigo-100", text: "text-indigo-600", lightBg: "bg-indigo-50" },
  { status: "Applied", title: "Applied", color: "bg-slate-400", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", lightBg: "bg-slate-100" },
  { status: "OA/Screening", title: "OA / Screening", color: "bg-blue-500", bg: "bg-blue-50/40", border: "border-blue-100", text: "text-blue-600", lightBg: "bg-blue-50" },
  { status: "Interview", title: "Interview", color: "bg-violet-500", bg: "bg-violet-50/40", border: "border-violet-100", text: "text-violet-600", lightBg: "bg-violet-50" },
  { status: "Offer", title: "Offer", color: "bg-emerald-500", bg: "bg-emerald-50/40", border: "border-emerald-100", text: "text-emerald-600", lightBg: "bg-emerald-50" },
  { status: "Selected", title: "Selected", color: "bg-cyan-500", bg: "bg-cyan-50/40", border: "border-cyan-100", text: "text-cyan-600", lightBg: "bg-cyan-50" },
  { status: "Rejected", title: "Rejected", color: "bg-rose-500", bg: "bg-rose-50/40", border: "border-rose-100", text: "text-rose-600", lightBg: "bg-rose-50" },
];

const STATUS_ORDER: Record<JobStatus, number> = {
  "Wishlist": 1,
  "Saved": 2,
  "Applied": 3,
  "OA/Screening": 4,
  "Interview": 5,
  "Offer": 6,
  "Selected": 7,
  "Rejected": 8,
};

const parseSalaryStr = (str: string) => {
  if (!str) return { min: "", max: "" };
  const parts = str.split("-");
  const clean = (s: string) => s.replace(/\D/g, "");
  return {
    min: parts[0] ? clean(parts[0]) : "",
    max: parts[1] ? clean(parts[1]) : "",
  };
};

const buildSalaryStr = (min: string, max: string) => {
  const cleanMin = min.trim();
  const cleanMax = max.trim();
  if (cleanMin && cleanMax) {
    return `₹${Number(cleanMin).toLocaleString("en-IN")} - ₹${Number(cleanMax).toLocaleString("en-IN")}`;
  } else if (cleanMin) {
    return `₹${Number(cleanMin).toLocaleString("en-IN")}`;
  } else if (cleanMax) {
    return `₹${Number(cleanMax).toLocaleString("en-IN")}`;
  }
  return "";
};

// Helper to clean salary value formatting


interface CareerNotesViewProps {
  userNotes: any[];
  setUserNotes: React.Dispatch<React.SetStateAction<any[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

function CareerNotesView({ userNotes, setUserNotes, setNotifications }: CareerNotesViewProps) {
  const [noteSearch, setNoteSearch] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string>(userNotes[0]?.id || "");
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");

  const activeNote = userNotes.find(n => n.id === activeNoteId);

  // Sync form states with active note
  useEffect(() => {
    if (isCreatingNewNote) {
      setFormTitle("");
      setFormContent("");
    } else if (isEditingNote && activeNote) {
      setFormTitle(activeNote.title);
      setFormContent(activeNote.content);
    }
  }, [isCreatingNewNote, isEditingNote, activeNote]);

  const filteredNotes = userNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      note.content.toLowerCase().includes(noteSearch.toLowerCase());
    return matchesSearch;
  });

  const handleSelectNote = (note: any) => {
    setIsCreatingNewNote(false);
    setActiveNoteId(note.id);
    setIsEditingNote(true);
  };

  const handleStartNewNote = () => {
    setIsCreatingNewNote(true);
    setIsEditingNote(false);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (isCreatingNewNote) {
      const newNote = {
        id: `note-${Date.now()}`,
        title: formTitle,
        category: "General",
        content: formContent,
        updatedAt: new Date().toISOString().split("T")[0]
      };
      setUserNotes(prev => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setIsCreatingNewNote(false);
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: "Note Created Successfully",
          message: `"${newNote.title}" was added to your notebook.`,
          time: "Just now",
          isRead: false,
          type: "success"
        },
        ...prev
      ]);
    } else if (isEditingNote && activeNoteId) {
      setUserNotes(prev => prev.map(note => {
        if (note.id === activeNoteId) {
          return {
            ...note,
            title: formTitle,
            content: formContent,
            updatedAt: new Date().toISOString().split("T")[0]
          };
        }
        return note;
      }));
      setIsEditingNote(false);
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: "Note Updated Successfully",
          message: `"${formTitle}" has been updated.`,
          time: "Just now",
          isRead: false,
          type: "success"
        },
        ...prev
      ]);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const remaining = userNotes.filter(n => n.id !== noteId);
    setUserNotes(remaining);
    if (remaining.length > 0) {
      handleSelectNote(remaining[0]);
    } else {
      setActiveNoteId("");
      setFormTitle("");
      setFormContent("");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      {/* Header section with Title and New Note Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Notebook className="h-5 w-5 text-indigo-500" />
            My Career Notebook ({filteredNotes.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Keep track of your interview prep, wishlist items, goals, and cover letter drafts. Click any note to edit immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartNewNote}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs shrink-0 sm:self-center"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={noteSearch}
          onChange={(e) => setNoteSearch(e.target.value)}
          placeholder="Search note titles or contents..."
          className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
        />
      </div>

      {/* Notes cards list */}
      {filteredNotes.length === 0 ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500">
          <Notebook className="h-12 w-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No notes found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Search terms didn't match any titles or contents, or your notebook is empty. Click "New Note" to draft one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map(note => {
            return (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className="group relative p-5 rounded-2xl border bg-slate-50/45 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-700/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[190px]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Notebook className="h-3.5 w-3.5" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {note.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono shrink-0 whitespace-nowrap">
                      {note.updatedAt}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-4 font-medium">
                    {note.content}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100/60 dark:border-slate-800/60">
                  {noteIdToDelete === note.id ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Confirm?</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                          setNoteIdToDelete(null);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteIdToDelete(null);
                        }}
                        className="px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectNote(note);
                        }}
                        className="p-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteIdToDelete(note.id);
                        }}
                        className="p-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popup Modal for Creating or Editing a Note */}
      <AnimatePresence>
        {(isCreatingNewNote || isEditingNote) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
            <div
              className="absolute inset-0 cursor-default"
              onClick={() => {
                setIsCreatingNewNote(false);
                setIsEditingNote(false);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg p-6 space-y-5 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  {isCreatingNewNote ? (
                    <>
                      <Plus className="h-4.5 w-4.5 text-indigo-500" />
                      Create Fresh Career Note
                    </>
                  ) : (
                    <>
                      <Edit className="h-4.5 w-4.5 text-indigo-500" />
                      Edit Career Note
                    </>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewNote(false);
                    setIsEditingNote(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Note Title / Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. My Career Goals"
                    className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Detailed Note Content
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Draft your detailed thoughts, templates, guides or answers here..."
                    className="w-full text-xs font-medium bg-slate-50 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 hover:dark:bg-slate-900/70 focus:bg-white dark:focus:bg-slate-950 rounded-xl border border-slate-200 px-3.5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3.5">
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-100/40">
                    <Pin className="h-3 w-3" />
                    <span>Stored in Offline Safe Cache</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewNote(false);
                        setIsEditingNote(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <BadgeCheck className="h-4 w-4" />
                      <span>{isCreatingNewNote ? "Add Note" : "Save Changes"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("placofy_user_logged") === "true";
  });

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem("placofy_user_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      name: "",
      email: "",
      title: "",
      location: "",
      targetRole: "",
      skills: "",
      linkedinUrl: "",
      bio: ""
    };
  });

  useEffect(() => {
    localStorage.setItem("placofy_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        localStorage.setItem("placofy_user_logged", "true");
        // Update user profile dynamically with Firebase details if they differ
        setUserProfile((prev) => {
          const updated = { ...prev };
          if (user.email && !prev.email) updated.email = user.email;
          // Only fill name from Firebase when local name is empty so edits are not overwritten
          if (user.displayName && !prev.name.trim()) updated.name = user.displayName;
          return updated;
        });
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem("placofy_user_logged");
      }
    });
    return () => unsubscribe();
  }, []);

  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem("placofy_applications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("placofy_applications", JSON.stringify(applications));
  }, [applications]);

  const [viewMode, setViewMode] = useState<"kanban" | "table" | "ats" | "profile" | "resumes" | "notes">("kanban");

  // Dynamic live system time
  const [systemTime, setSystemTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) + " " + now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setSystemTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Modals visibility states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [profileDropdownTab, setProfileDropdownTab] = useState<"menu" | "notifications">("menu");

  // Gemini Paste states
  const [pasteText, setPasteText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState("");

  // ATS Optimizer states
  const [atsResumeText, setAtsResumeText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileSize, setUploadedFileSize] = useState<string>("");
  const [atsJobDescriptionText, setAtsJobDescriptionText] = useState("");
  const [prefCompanyName, setPrefCompanyName] = useState("");
  const [selectedAtsAppId, setSelectedAtsAppId] = useState<string>("");
  const [aiAtsResult, setAiAtsResult] = useState<{
    score: number;
    matched: string[];
    missing: string[];
    atsSuggestions: string[];
  } | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);

  // Resume bullet optimizer state
  const [bulletToOptimize, setBulletToOptimize] = useState("");
  const [optimizedBulletResult, setOptimizedBulletResult] = useState("");
  const [isOptimizingBullet, setIsOptimizingBullet] = useState(false);

  // State to handle interview questions and outreach mail on-the-fly
  const [prepQuestions, setPrepQuestions] = useState<{ question: string; response: string }[]>([]);
  const [expandedPrepIdx, setExpandedPrepIdx] = useState<Record<number, boolean>>({});
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [outreachDraft, setOutreachDraft] = useState("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);

  // --- Dark Mode State ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("placofy_dark_mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("placofy_dark_mode", String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  // --- Resume Storage State ---
  const [resumes, setResumes] = useState<any[]>(() => {
    const saved = localStorage.getItem("placofy_resumes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("placofy_resumes", JSON.stringify(resumes));
    // Synchronize active resume with standard ATS analyzer state so it uses the selected resume!
    const active = resumes.find(r => r.isSelected);
    if (active) {
      setAtsResumeText(active.content);
      setUploadedFileName(active.name);
      setUploadedFileSize(active.fileSize);
    }
  }, [resumes]);

  const [resumeIdToDelete, setResumeIdToDelete] = useState<string | null>(null);

  // --- Career Notes State ---
  const [userNotes, setUserNotes] = useState<any[]>(() => {
    const saved = localStorage.getItem("placofy_user_notes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [
      {
        id: "note-instructions",
        title: "Career Notebook Instructions",
        content: "Welcome to your Personal Career Notebook!\n\nUse this section to keep your thoughts, interview preparation guides, and career notes organized.\n\nQuick Guide:\n1. Click the \"+ Add New Note\" button at the bottom of the sidebar to create a new note.\n2. Enter a clear title and draft your notes, answers to behavioral questions, coding tips, or company research in the detailed note area.\n3. Your notes are automatically saved to your browser's secure local storage so you never lose your progress.\n4. Click on any note in the list to read it. If you no longer need a note, you can permanently delete it using the \"Delete Note\" button.\n\nAll features are designed to keep you focused and prepared for your dream job!",
        category: "General",
        updatedAt: "2026-07-04"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("placofy_user_notes", JSON.stringify(userNotes));
  }, [userNotes]);

  // --- Notifications State ---
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem("placofy_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [
      {
        id: "notif-1",
        title: "Welcome to Placofy Dashboard",
        message: "Your job applications, resume storage, and custom notes are now fully synchronized and ready for use.",
        time: "Just now",
        isRead: false,
        type: "success"
      },
      {
        id: "notif-2",
        title: "Resume Storage Integrated",
        message: "You can now select and switch resumes. Your active resume is automatically coupled with the ATS Optimizer!",
        time: "5 minutes ago",
        isRead: false,
        type: "info"
      }
    ];
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("placofy_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Automated checker to scan upcoming deadlines in job applications and fire real-time warnings
  useEffect(() => {
    if (applications.length === 0) return;
    const now = new Date();
    const upcomingDeadlines = applications.filter(app => {
      if (!app.deadline) return false;
      const d = new Date(app.deadline);
      const diffTime = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3; // within 3 days
    });

    if (upcomingDeadlines.length > 0) {
      const newNotifs = [...notifications];
      let updated = false;

      upcomingDeadlines.forEach(app => {
        const notifId = `deadline-warn-${app.id}`;
        // check if already exists
        if (!newNotifs.some(n => n.id === notifId)) {
          newNotifs.unshift({
            id: notifId,
            title: `Deadline Alert: ${app.company}`,
            message: `The application deadline for ${app.role} at ${app.company} is approaching on ${app.deadline}!`,
            time: "Action required",
            isRead: false,
            type: "deadline"
          });
          updated = true;
        }
      });

      if (updated) {
        setNotifications(newNotifs);
      }
    }
  }, [applications]);

  // Fallback guard to ensure selectedAtsAppId is always valid
  useEffect(() => {
    if (applications.length > 0) {
      if (!applications.some(a => a.id === selectedAtsAppId)) {
        setSelectedAtsAppId(applications[0].id);
      }
    } else {
      setSelectedAtsAppId("");
    }
  }, [applications, selectedAtsAppId]);

  // Synchronize Job Description input with selected app card's notes/description
  useEffect(() => {
    if (selectedAtsAppId) {
      const selectedApp = applications.find(a => a.id === selectedAtsAppId);
      if (selectedApp) {
        setAtsJobDescriptionText(selectedApp.notes || "");
      }
    }
  }, [selectedAtsAppId, applications]);

  // Dynamically suggest a tailored weak bullet when job description changes
  useEffect(() => {
    if (atsJobDescriptionText) {
      const suggested = getSuggestedWeakBullet(atsJobDescriptionText);
      // Only auto-update if the current bullet is a default one or empty to avoid overwriting user manual inputs
      const isDefault = [
        "Worked on a web application development team.",
        "Worked on a web application development team",
        "Worked on React components, made some UI screens, and resolved front-end tickets.",
        "Assisted in writing API endpoints, ran SQL database queries, and worked on server bugs.",
        "Helped with both frontend and backend tasks and maintained the main application.",
        "Helped with data analysis tasks, ran some Python scripts, and built simple data tables.",
        "Responsible for developing software application features and attending team meetings.",
        ""
      ].includes(bulletToOptimize.trim());

      if (isDefault) {
        setBulletToOptimize(suggested);
      }
    }
  }, [atsJobDescriptionText]);

  // Manual trigger to extract keywords from Job Description and run ATS assessment
  const handleRunAtsAnalysis = async (overrideJobText?: string) => {
    const jobTextToUse = (typeof overrideJobText === 'string' ? overrideJobText : atsJobDescriptionText);

    if (!atsResumeText.trim()) {
      setModalAlert({
        title: "Resume File Required",
        message: "Please upload a resume file (.txt, .pdf, or .docx) to run the ATS checker.",
        type: "info"
      });
      return;
    }
    if (!jobTextToUse.trim()) {
      setModalAlert({
        title: "Job Description Required",
        message: "Please paste a job description to extract keywords and analyze compatibility.",
        type: "info"
      });
      return;
    }

    setIsAnalyzingResume(true);
    try {
      // 1. Extract job details and suggested keywords from job description
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: jobTextToUse })
      });
      const extractedData = await extractRes.json();

      const keywords = extractedData.suggestedKeywords || [
        "React", "TypeScript", "JavaScript", "Tailwind CSS", "REST APIs", "Git"
      ];
      const suggestions = extractedData.atsSuggestions || [
        "Include more quantifiable metrics in your resume bullets.",
        "Ensure the technical skills section highlights matching tech stacks.",
        "Add a brief professional summary focusing on frontend achievements."
      ];

      const targetCompany = extractedData.company || "Target Company";
      const targetRole = extractedData.role || "Target Role";

      // 2. Perform ATS analysis comparing resume text and extracted keywords
      const analyzeRes = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: atsResumeText,
          company: prefCompanyName.trim() || targetCompany,
          role: targetRole,
          location: extractedData.location || "Remote",
          notes: jobTextToUse,
          keywords: keywords
        })
      });
      const analyzeData = await analyzeRes.json();

      const matchedKeywords = analyzeData.matched || [];
      const missingKeywords = analyzeData.missing || [];

      setAiAtsResult({
        score: typeof analyzeData.score === "number" ? analyzeData.score : 70,
        matched: matchedKeywords,
        missing: missingKeywords,
        atsSuggestions: analyzeData.atsSuggestions || suggestions
      });

      const displayScore = typeof analyzeData.score === "number" ? analyzeData.score : 70;
      setModalAlert({
        title: "ATS Analysis Complete",
        message: `Compatibility score generated: ${displayScore}%. Extracted key terms successfully! Use the Suite Section A, B, and C tools below to optimize your bullet points, generate interview prep questions, and draft outreach emails.`,
        type: "success"
      });
    } catch (err) {
      console.error("Resume analysis failed, falling back to local extractor:", err);

      // Highly robust local matcher fallback
      const commonTechWords = [
        "React", "TypeScript", "JavaScript", "Tailwind CSS", "REST APIs", "Node.js", "Express",
        "Webpack", "Vite", "Git", "Agile", "Frontend", "HTML5", "CSS3", "Responsive Design",
        "Redux", "GraphQL", "Next.js", "Docker", "AWS", "CI/CD", "Testing", "Jest"
      ];

      // Dynamic Extraction from the actual pasted job description
      const extractedKeywords = commonTechWords.filter(word => {
        const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(atsJobDescriptionText);
      });

      if (extractedKeywords.length === 0) {
        extractedKeywords.push("React", "TypeScript", "JavaScript", "Frontend");
      }

      const resumeLower = atsResumeText.toLowerCase();
      const matched: string[] = [];
      const missing: string[] = [];

      extractedKeywords.forEach(kw => {
        const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(resumeLower) || resumeLower.includes(kw.toLowerCase())) {
          matched.push(kw);
        } else {
          missing.push(kw);
        }
      });

      const score = Math.round((matched.length / extractedKeywords.length) * 100) || 0;

      setAiAtsResult({
        score,
        matched,
        missing,
        atsSuggestions: [
          "Make sure your resume contains exact skill matches as they appear in the job description.",
          "Add metrics or details on team sizes, delivery timelines, and framework upgrades.",
          "Ensure your contact details and key titles are placed clearly at the top of the file."
        ]
      });

      setModalAlert({
        title: "Local ATS Check Completed",
        message: `Scored resume at ${score}% compatibility by matching keywords extracted locally! Use the Suite Section A, B, and C tools below to optimize your bullet points, generate interview prep questions, and draft outreach emails.`,
        type: "success"
      });
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  // Edit & Draft state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Custom alerts and confirmation states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [modalAlert, setModalAlert] = useState<{ title: string; message: string; type?: "success" | "error" | "info" } | null>(null);

  // Form values state
  const [formState, setFormState] = useState({
    company: "",
    role: "",
    location: "",
    salaryRange: "",
    minSalary: "",
    maxSalary: "",
    dateApplied: TODAY_DATE,
    deadline: "",
    source: "LinkedIn" as JobSource,
    customSource: "",
    url: "",
    notes: "",
    status: "Applied" as JobStatus,
    suggestedKeywords: [] as string[],
    atsSuggestions: [] as string[],
  });

  const [formErrors, setFormErrors] = useState({
    company: "",
    role: "",
  });

  // Filter & Search states (primarily for table and quick searches)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("dateApplied");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [showWithDeadlines, setShowWithDeadlines] = useState(false);
  const [hideRejected, setHideRejected] = useState(false);

  const [selectedMissingKeyword, setSelectedMissingKeyword] = useState<string | null>(null);
  const [optimizedBulletOptions, setOptimizedBulletOptions] = useState<{ type: string; bullet: string }[]>([]);

  // Computed ATS Match calculation in high-perfection Realtime
  const realTimeAtsAnalysis = useMemo(() => {
    if (aiAtsResult) {
      const matched = [...(aiAtsResult.matched || [])];
      const missing = [...(aiAtsResult.missing || [])];

      // If the candidate appends missing keywords to their resume, dynamically promote them!
      const resumeLower = atsResumeText.toLowerCase();
      for (let i = missing.length - 1; i >= 0; i--) {
        const kw = missing[i];
        const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const wordRegex = new RegExp(`(?:\\b|\\s|^)${escaped}(?:\\b|\\s|$|\\.|,|:)`, 'i');
        if (wordRegex.test(resumeLower) || resumeLower.includes(kw.toLowerCase())) {
          matched.push(kw);
          missing.splice(i, 1);
        }
      }

      const totalKeywords = matched.length + missing.length;
      const score = totalKeywords > 0
        ? Math.round((matched.length / totalKeywords) * 100)
        : aiAtsResult.score;

      return {
        score,
        matched,
        missing,
        atsSuggestions: aiAtsResult.atsSuggestions || []
      };
    }

    let targetKeywords: string[] = [];
    if (atsJobDescriptionText.trim()) {
      targetKeywords = extractKeywordsLocally(atsJobDescriptionText);
    }

    if (targetKeywords.length === 0) {
      targetKeywords = ["React", "TypeScript", "Tailwind CSS", "REST APIs", "Git", "Webpack", "Responsive Design"];
    }

    const resumeLower = atsResumeText.toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];

    targetKeywords.forEach(kw => {
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const wordRegex = new RegExp(`(?:\\b|\\s|^)${escaped}(?:\\b|\\s|$|\\.|,|:)`, 'i');
      if (wordRegex.test(resumeLower) || resumeLower.includes(kw.toLowerCase())) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const score = targetKeywords.length > 0
      ? Math.round((matched.length / targetKeywords.length) * 100)
      : 0;

    return {
      score,
      matched,
      missing,
      atsSuggestions: [
        "Include more quantifiable metrics in your resume bullets.",
        "Ensure the technical skills section highlights matching tech stacks.",
        "Add a brief professional summary focusing on frontend achievements."
      ]
    };
  }, [atsResumeText, atsJobDescriptionText, aiAtsResult]);

  // Handler to optimize weak bullet points
  const handleOptimizeBullet = async () => {
    if (!bulletToOptimize.trim()) return;
    setIsOptimizingBullet(true);
    setOptimizedBulletResult("");
    setOptimizedBulletOptions([]);
    try {
      const currentKeywords = realTimeAtsAnalysis.matched.slice(0, 5);

      const res = await fetch("/api/optimize-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: bulletToOptimize,
          keywords: currentKeywords,
          jobDescription: atsJobDescriptionText,
          company: prefCompanyName.trim()
        }),
      });
      const data = await res.json();
      if (data.optimized) {
        setOptimizedBulletResult(data.optimized);
      }
      if (data.options) {
        setOptimizedBulletOptions(data.options);
      } else if (data.error) {
        setOptimizedBulletResult(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setOptimizedBulletResult("Failed to optimize bullet. Please try again.");
    } finally {
      setIsOptimizingBullet(false);
    }
  };

  // Generate Interview Questions
  const handleGeneratePrep = async () => {
    setIsGeneratingPrep(true);
    setPrepQuestions([]);
    setExpandedPrepIdx({});
    try {
      const { role } = guessCompanyAndRole(atsJobDescriptionText);
      const keywords = realTimeAtsAnalysis.matched;

      const res = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          keywords,
          jobDescription: atsJobDescriptionText,
          company: prefCompanyName.trim()
        }),
      });
      const data = await res.json();
      if (data.questions) {
        setPrepQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  // Generate Cold Outreach Draft
  const handleGenerateOutreach = async () => {
    setIsGeneratingOutreach(true);
    setOutreachDraft("");
    try {
      const { role, company } = guessCompanyAndRole(atsJobDescriptionText);
      const keywords = realTimeAtsAnalysis.matched;

      const res = await fetch("/api/outreach-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: prefCompanyName.trim() || company,
          role,
          keywords,
          jobDescription: atsJobDescriptionText,
          userName: userProfile?.name || "the candidate"
        }),
      });
      const data = await res.json();
      if (data.email) {
        // Substitute typical placeholders just to be absolutely bulletproof
        const finalDraft = data.email
          .replace(/\[Your\s*Name\]/gi, userProfile?.name || "the candidate")
          .replace(/\[Name\]/gi, userProfile?.name || "the candidate");
        setOutreachDraft(finalDraft);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // Reset form helper
  const openNewApplicationModal = () => {
    setFormState({
      company: "",
      role: "",
      location: "",
      salaryRange: "",
      minSalary: "",
      maxSalary: "",
      dateApplied: TODAY_DATE,
      deadline: "",
      source: "LinkedIn",
      customSource: "",
      url: "",
      notes: "",
      status: "Applied",
      suggestedKeywords: [],
      atsSuggestions: [],
    });
    setFormErrors({ company: "", role: "" });
    setEditingId(null);
    setIsEditMode(false);
    setIsAddOpen(true);
  };

  // Open edit modal helper
  const openEditApplicationModal = (app: JobApplication) => {
    const parsed = parseSalaryStr(app.salaryRange || "");
    setFormState({
      company: app.company,
      role: app.role,
      location: app.location,
      salaryRange: app.salaryRange || "",
      minSalary: parsed.min,
      maxSalary: parsed.max,
      dateApplied: app.dateApplied,
      deadline: app.deadline,
      source: app.source,
      customSource: app.customSource || "",
      url: app.url,
      notes: app.notes,
      status: app.status,
      suggestedKeywords: app.suggestedKeywords || [],
      atsSuggestions: app.atsSuggestions || [],
    });
    setFormErrors({ company: "", role: "" });
    setEditingId(app.id);
    setIsEditMode(true);
    setIsAddOpen(true);
  };

  // Delete handler
  const handleDeleteApplication = (id: string) => {
    setDeleteConfirmId(id);
  };

  // Status rapid change handler (dropdown on card or table row)
  const handleStatusChange = (id: string, newStatus: JobStatus) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
            ...app,
            status: newStatus,
            statusChangedAt: new Date().toISOString(),
          }
          : app
      )
    );
  };

  // Save / update application
  const handleSaveApplication = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    let hasError = false;
    const errors = { company: "", role: "" };

    if (!formState.company.trim()) {
      errors.company = "Company name is required";
      hasError = true;
    }
    if (!formState.role.trim()) {
      errors.role = "Job title/role is required";
      hasError = true;
    }

    setFormErrors(errors);
    if (hasError) return;

    const finalSalaryRange = buildSalaryStr(formState.minSalary || "", formState.maxSalary || "");

    if (isEditMode && editingId) {
      // Edit mode
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === editingId) {
            // Check if status changed to update statusChangedAt timestamp
            const statusChanged = app.status !== formState.status;
            return {
              ...app,
              company: formState.company.trim(),
              role: formState.role.trim(),
              location: formState.location.trim(),
              salaryRange: finalSalaryRange,
              dateApplied: formState.dateApplied,
              deadline: formState.deadline,
              source: formState.source,
              customSource: formState.source === "Other" ? formState.customSource.trim() : "",
              url: formState.url.trim(),
              notes: formState.notes.trim(),
              status: formState.status,
              statusChangedAt: statusChanged ? new Date().toISOString() : app.statusChangedAt,
              suggestedKeywords: formState.suggestedKeywords,
              atsSuggestions: formState.atsSuggestions,
            };
          }
          return app;
        })
      );
    } else {
      // Create mode
      const newApp: JobApplication = {
        id: `app-${Math.random().toString(36).substring(2, 9)}`,
        company: formState.company.trim(),
        role: formState.role.trim(),
        location: formState.location.trim(),
        salaryRange: finalSalaryRange,
        dateApplied: formState.dateApplied,
        deadline: formState.deadline,
        source: formState.source,
        customSource: formState.source === "Other" ? formState.customSource.trim() : "",
        url: formState.url.trim(),
        notes: formState.notes.trim(),
        status: formState.status,
        statusChangedAt: new Date().toISOString(),
        suggestedKeywords: formState.suggestedKeywords,
        atsSuggestions: formState.atsSuggestions,
      };
      setApplications((prev) => [newApp, ...prev]);
    }

    setIsAddOpen(false);
  };

  // Call Gemini extract API
  const handleGeminiExtract = async (overrideText?: string) => {
    const textToExtract = typeof overrideText === 'string' ? overrideText : pasteText;
    if (!textToExtract.trim()) {
      setModalAlert({
        title: "No Job Description",
        message: "Please paste a job description or posting text.",
        type: "info"
      });
      return;
    }

    setIsExtracting(true);
    setExtractionError("");

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToExtract }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Extraction failed. The server returned an error.");
      }

      const data = await response.json();

      // Pre-fill form state, clear paste text, close paste modal, open add application modal
      setFormState({
        company: data.company || "",
        role: data.role || "",
        location: data.location || "",
        salaryRange: data.salaryRange || "",
        dateApplied: TODAY_DATE,
        deadline: data.deadline || "",
        source: "LinkedIn",
        url: "",
        notes: "Extracted via Gemini AI from pasted job description.",
        status: "Applied",
        suggestedKeywords: data.suggestedKeywords || [],
        atsSuggestions: data.atsSuggestions || [],
      });

      setFormErrors({ company: "", role: "" });
      setPasteText("");
      setIsPasteOpen(false);
      setIsAddOpen(true);
      setIsEditMode(false); // Creating a new parsed draft!
    } catch (err: any) {
      console.error("Gemini extract error:", err);
      setExtractionError(err.message || "An unexpected error occurred. Please verify your connection or paste manual entries.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const total = applications.length;
    if (total === 0) {
      return { total: 0, responseRate: "0.0%", interviewRate: "0.0%", needsFollowUpCount: 0 };
    }

    // Response rate: % of applications moved past the "Applied" status
    const movedPastApplied = applications.filter((app) => app.status !== "Applied").length;
    const responseRate = ((movedPastApplied / total) * 100).toFixed(1) + "%";

    // Interview conversion rate: % of applications that reached "Interview" or "Offer" status
    const reachedInterviewOrOffer = applications.filter(
      (app) => app.status === "Interview" || app.status === "Offer"
    ).length;
    const interviewRate = ((reachedInterviewOrOffer / total) * 100).toFixed(1) + "%";

    // Needs follow-up count: applications with no status change in 14+ days (excluding terminal states)
    const needsFollowUpCount = applications.filter(needsFollowUp).length;

    return { total, responseRate, interviewRate, needsFollowUpCount };
  }, [applications]);

  // Sorting & Filtering primarily for Table View
  const sortedAndFilteredApplications = useMemo(() => {
    let list = [...applications];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (app) =>
          app.company.toLowerCase().includes(term) ||
          app.role.toLowerCase().includes(term) ||
          app.location.toLowerCase().includes(term)
      );
    }

    // Filter by status dropdown
    if (statusFilter) {
      list = list.filter((app) => app.status === statusFilter);
    }

    // Apply smart filters
    if (showRemoteOnly) {
      list = list.filter(app => (app.location || "").toLowerCase().includes("remote"));
    }
    if (showWithDeadlines) {
      list = list.filter(app => !!app.deadline);
    }
    if (hideRejected) {
      list = list.filter(app => app.status !== "Rejected");
    }

    // Apply sorting
    list.sort((a, b) => {
      let valA: any = a[sortField] || "";
      let valB: any = b[sortField] || "";

      if (sortField === "status") {
        valA = STATUS_ORDER[a.status];
        valB = STATUS_ORDER[b.status];
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [applications, searchTerm, statusFilter, sortField, sortOrder, showRemoteOnly, showWithDeadlines, hideRejected]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLoginSuccess={(profile) => {
          if (profile) {
            setUserProfile(profile);
          }
          setIsLoggedIn(true);
          localStorage.setItem("placofy_user_logged", "true");
          const hasName = Boolean(profile?.name?.trim());
          if (!hasName) {
            setIsProfileEditOpen(true);
          }
          setModalAlert({
            title: "Access Granted",
            message: hasName
              ? "Welcome to Placofy! You are logged in."
              : "Welcome to Placofy! Add your name to finish setting up your profile.",
            type: "success"
          });
        }} />
        {modalAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <h3 className={`text-base font-bold ${modalAlert.type === "error" ? "text-rose-600" : "text-indigo-600"}`}>
                {modalAlert.title}
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {modalAlert.message}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalAlert(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Premium Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => {
                  setViewMode("kanban");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-indigo-100 dark:shadow-none transition-all duration-300 hover:rotate-6 hover:scale-110 cursor-pointer bg-white border border-slate-200/60 dark:border-slate-700"
                title="Go to Kanban Board"
              >
                <img src="/icon-192.png" alt="Placofy" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1
                  onClick={() => {
                    setViewMode("kanban");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent hover:from-indigo-600 hover:to-violet-500 transition-all duration-300 cursor-pointer"
                  id="app-title"
                >
                  Placofy
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold font-sans select-none bg-slate-50/80 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-full px-2 py-0.5 shadow-3xs hover:bg-white hover:dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-default">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{systemTime || "July 2, 2026"}</span>
                  </div>
