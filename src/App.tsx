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
      role = role.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
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

  const [applications, setApplications] = useState<JobApplication[]>([]);
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
      } catch (e) {}
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
      } catch (e) {}
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
      } catch (e) {}
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
  const handleRunAtsAnalysis = async () => {
    if (!atsResumeText.trim()) {
      setModalAlert({
        title: "Resume File Required",
        message: "Please upload a resume file (.txt, .pdf, or .docx) to run the ATS checker.",
        type: "info"
      });
      return;
    }
    if (!atsJobDescriptionText.trim()) {
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
        body: JSON.stringify({ text: atsJobDescriptionText })
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
          notes: atsJobDescriptionText,
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
  const handleGeminiExtract = async () => {
    if (!pasteText.trim()) {
      setExtractionError("Please paste some job description or posting text first.");
      return;
    }

    setIsExtracting(true);
    setExtractionError("");

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
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
                className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 dark:shadow-none transition-all duration-300 hover:rotate-6 hover:scale-110 cursor-pointer"
                title="Go to Kanban Board"
              >
                <Briefcase className="w-5 h-5 text-white" />
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
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold font-sans mt-0.5 select-none bg-slate-50/80 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-full px-2 py-0.5 shadow-3xs hover:bg-white hover:dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-default">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{systemTime || "July 2, 2026"}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                id="btn-ats-suite"
                onClick={() => {
                  setViewMode("ats");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto transform active:scale-95 transition-all duration-200 hover:-translate-y-0.5 ${
                  viewMode === "ats"
                    ? "text-white bg-gradient-to-r from-indigo-600 to-violet-600 border-transparent hover:from-indigo-500 hover:to-violet-500 hover:shadow-md hover:shadow-indigo-100"
                    : "text-slate-700 bg-white border-slate-200 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Resume &amp; ATS Suite</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-add-application"
                  onClick={openNewApplicationModal}
                  className="flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] transform active:scale-95 hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Application</span>
                </button>

                {/* Profile Icon Dropdown Container */}
                <div className="relative shrink-0" id="three-dot-menu-container">
                  <button
                    type="button"
                    id="btn-more-options"
                    onClick={() => {
                      setIsMoreMenuOpen(prev => !prev);
                      setProfileDropdownTab("menu"); // always reset tab when opening
                    }}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer shadow-3xs transform active:scale-95 hover:-translate-y-0.5"
                    title="User Profile & Quick Tools"
                    aria-label="User profile and options"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-extrabold text-xs select-none shadow-inner shrink-0">
                      {userProfile.name ? userProfile.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="text-left hidden sm:block select-none max-w-[100px]">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                        {userProfile.name || "User"}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">
                        Workspace
                      </p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  </button>
                  {/* Dropdown Menu */}
                  {isMoreMenuOpen && (
                    <>
                      {/* Backdrop to close */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsMoreMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-100 max-h-[480px] overflow-y-auto">
                        
                        {profileDropdownTab === "menu" ? (
                          <>
                            {/* Profile Info Header Section */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 rounded-t-2xl flex flex-col items-center text-center">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md mb-2">
                                {userProfile.name ? userProfile.name[0].toUpperCase() : "U"}
                              </div>
                              <p className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">{userProfile.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-1 font-semibold">{userProfile.title}</p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-400 line-clamp-1 font-mono mt-0.5">{userProfile.email}</p>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  setViewMode("profile");
                                  setIsMoreMenuOpen(false);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="mt-2.5 w-full py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/45 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-3xs"
                              >
                                <User className="h-3 w-3 text-indigo-500" />
                                View / Edit Profile
                              </button>
                            </div>

                            {/* Theme and Notification quick actions inside profile dropdown */}
                            <div className="grid grid-cols-2 gap-2 p-2.5 border-b border-slate-100 dark:border-slate-700">
                              {/* Theme Toggle */}
                              <button
                                type="button"
                                onClick={() => setIsDarkMode(prev => !prev)}
                                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/45 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/60 dark:border-slate-700/80 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                              >
                                {isDarkMode ? (
                                  <>
                                    <Sun className="h-3.5 w-3.5 text-amber-500 fill-amber-100" />
                                    <span>Light Mode</span>
                                  </>
                                ) : (
                                  <>
                                    <Moon className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Dark Mode</span>
                                  </>
                                )}
                              </button>

                              {/* Notifications Switch */}
                              <button
                                type="button"
                                onClick={() => setProfileDropdownTab("notifications")}
                                className="relative flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/45 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/60 dark:border-slate-700/80 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                              >
                                <Bell className="h-3.5 w-3.5 text-indigo-500" />
                                <span>Alerts ({notifications.filter(n => !n.isRead).length})</span>
                                {notifications.some(n => !n.isRead) && (
                                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                )}
                              </button>
                            </div>

                            {/* Section 1: Smart Filter Options */}
                            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 mb-1 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Smart Filters
                              </span>
                            </div>

                        <button
                          type="button"
                          onClick={() => {
                            setHideRejected(prev => !prev);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-900 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                            <span>Hide Rejected & Closed</span>
                          </div>
                          <div className={`h-2.5 w-2.5 rounded-full transition-all ${hideRejected ? 'bg-indigo-600 scale-110 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowRemoteOnly(prev => !prev);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-900 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Laptop className="h-3.5 w-3.5 text-slate-400" />
                            <span>Show Remote Only</span>
                          </div>
                          <div className={`h-2.5 w-2.5 rounded-full transition-all ${showRemoteOnly ? 'bg-indigo-600 scale-110 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowWithDeadlines(prev => !prev);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-900 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>Show with Deadlines</span>
                          </div>
                          <div className={`h-2.5 w-2.5 rounded-full transition-all ${showWithDeadlines ? 'bg-indigo-600 scale-110 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setHideRejected(false);
                            setShowRemoteOnly(false);
                            setShowWithDeadlines(false);
                            setStatusFilter("");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Filter className="h-3.5 w-3.5" />
                          <span>Reset All Filters</span>
                        </button>

                        {/* Section: Custom Hubs */}
                        <div className="px-3 py-1.5 border-b border-t border-slate-100 my-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Career Navigation
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setViewMode("resumes");
                            setIsMoreMenuOpen(false);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                            viewMode === "resumes" ? "text-indigo-600 bg-indigo-50/70" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <FileText className="h-3.5 w-3.5 text-indigo-500" />
                          <span>My Resume Storage</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setViewMode("notes");
                            setIsMoreMenuOpen(false);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                            viewMode === "notes" ? "text-indigo-600 bg-indigo-50/70" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <Notebook className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Notes &amp; Wishlist Hub</span>
                        </button>

                        {/* Section 2: Quick Tools & Export */}
                        <div className="px-3 py-1.5 border-b border-t border-slate-100 my-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Quick Tools & Export
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            const formatToCSV = (apps: any[]): string => {
                              const headers = ["Company", "Role", "Status", "Location", "Salary Range", "Date Applied", "Deadline", "Source", "URL", "Notes"];
                              const rows = apps.map(app => [
                                app.company,
                                app.role,
                                app.status,
                                app.location || "",
                                app.salaryRange || "",
                                app.dateApplied || "",
                                app.deadline || "",
                                app.source + (app.customSource ? ` (${app.customSource})` : ""),
                                app.url || "",
                                (app.notes || "").replace(/"/g, '""')
                              ]);
                              return [
                                headers.join(","),
                                ...rows.map(row => row.map(val => `"${val}"`).join(","))
                              ].join("\n");
                            };
                            const csvContent = formatToCSV(applications);
                            const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
                            const downloadAnchor = document.createElement('a');
                            downloadAnchor.setAttribute("href", dataStr);
                            downloadAnchor.setAttribute("download", `placofy_applications_${TODAY_DATE}.csv`);
                            document.body.appendChild(downloadAnchor);
                            downloadAnchor.click();
                            downloadAnchor.remove();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-indigo-500" />
                          Download CSV Sheet
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            const formatToText = (apps: any[]): string => {
                              let txt = `==================================================\n`;
                              txt += `       PLACOFY - MY JOB APPLICATIONS SUMMARY    \n`;
                              txt += `       Generated on: ${new Date().toLocaleDateString()}\n`;
                              txt += `==================================================\n\n`;
                              apps.forEach((app, idx) => {
                                txt += `[${idx + 1}] ${app.company} - ${app.role}\n`;
                                txt += `--------------------------------------------------\n`;
                                txt += `• Status: ${app.status}\n`;
                                txt += `• Location: ${app.location || "N/A"}\n`;
                                txt += `• Salary Range: ${app.salaryRange || "N/A"}\n`;
                                txt += `• Date Applied: ${app.dateApplied || "N/A"}\n`;
                                txt += `• Deadline: ${app.deadline || "N/A"}\n`;
                                txt += `• Source: ${app.source}${app.customSource ? ` (${app.customSource})` : ""}\n`;
                                txt += `• Job URL: ${app.url || "N/A"}\n`;
                                txt += `• Notes: ${app.notes || "None"}\n\n`;
                              });
                              txt += `==================================================\n`;
                              txt += `End of Export. Total Tracked: ${apps.length} applications.\n`;
                              return txt;
                            };
                            const textContent = formatToText(applications);
                            const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textContent);
                            const downloadAnchor = document.createElement('a');
                            downloadAnchor.setAttribute("href", dataStr);
                            downloadAnchor.setAttribute("download", `placofy_applications_${TODAY_DATE}.txt`);
                            document.body.appendChild(downloadAnchor);
                            downloadAnchor.click();
                            downloadAnchor.remove();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-indigo-500" />
                          Download TEXT File (.txt)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            const countByStatus = {
                              Wishlist: applications.filter(a => a.status === "Wishlist").length,
                              Applied: applications.filter(a => a.status === "Applied").length,
                              Interview: applications.filter(a => a.status === "Interview").length,
                              Offer: applications.filter(a => a.status === "Offer").length,
                              Rejected: applications.filter(a => a.status === "Rejected").length,
                            };
                            const statsText = `My Job Search Progress Update 📈\n\n` +
                              `🎯 Total Tracked: ${applications.length}\n` +
                              `⭐ Wishlist: ${countByStatus.Wishlist}\n` +
                              `📝 Applied: ${countByStatus.Applied}\n` +
                              `👥 Interviewing: ${countByStatus.Interview}\n` +
                              `🎉 Offers Received: ${countByStatus.Offer}\n` +
                              `❌ Rejected/Closed: ${countByStatus.Rejected}\n\n` +
                              `Generated via Placofy! Keep pushing forward! 💪🚀`;
                            navigator.clipboard.writeText(statsText);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Share2 className="h-3.5 w-3.5 text-indigo-500" />
                          Copy Progress Summary
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setSortField("company");
                            setSortOrder("asc");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
                          Sort by Company (A-Z)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setSortField("dateApplied");
                            setSortOrder("desc");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
                          Sort by Recent Applied
                        </button>

                        {/* Section 3: Reset & Clear */}
                        <div className="px-3 py-1.5 border-b border-t border-slate-100 my-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            System Actions
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setApplications([]);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          Clear All Data
                        </button>

                        {/* Section 4: Account Actions */}
                        <div className="px-3 py-1.5 border-b border-t border-slate-100 my-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Account
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            setIsMoreMenuOpen(false);
                            try {
                              await signOut(auth);
                            } catch (e) {
                              console.error("Firebase signOut failed:", e);
                            }
                            localStorage.removeItem("placofy_user_logged");
                            setIsLoggedIn(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center gap-2 cursor-pointer rounded-b-xl"
                        >
                          <LogOut className="h-3.5 w-3.5 text-rose-500" />
                          Sign Out of Workspace
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Notification Tab Content */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 rounded-t-2xl flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setProfileDropdownTab("menu")}
                            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span>Back</span>
                          </button>
                          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Bell className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                            Alerts
                          </h3>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                              }}
                              className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              Read All
                            </button>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setNotifications([]);
                              }}
                              className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                              <CheckCircle className="h-8 w-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                              All caught up! No notifications.
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div 
                                key={notif.id} 
                                className={`p-3.5 flex gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                                  !notif.isRead ? "bg-indigo-50/25 dark:bg-indigo-950/10" : ""
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {notif.type === "success" && <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />}
                                  {notif.type === "deadline" && <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-bounce" />}
                                  {notif.type === "info" && <Briefcase className="h-4.5 w-4.5 text-blue-500" />}
                                </div>
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                                    <span className="text-[9px] font-medium text-slate-400 font-mono shrink-0">{notif.time}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{notif.message}</p>
                                  <div className="flex gap-2.5 pt-1">
                                    {!notif.isRead && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                                        }}
                                        className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                      >
                                        Mark read
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNotifications(prev => prev.filter(n => n.id !== notif.id));
                                      }}
                                      className="text-[9px] font-bold text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:underline"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex-1 w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Bar Banner: Dashboard Statistics */}
        {viewMode !== "ats" && (
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0" id="dashboard-stats-section">
            {/* Stat Item 1 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
              <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">{stats.total}</p>
            </div>

            {/* Stat Item 2 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response Rate</p>
              <p className="text-2xl font-bold mt-1 text-blue-600 font-mono">{stats.responseRate}</p>
            </div>

            {/* Stat Item 3 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview Conversion</p>
              <p className="text-2xl font-bold mt-1 text-purple-600 font-mono">{stats.interviewRate}</p>
            </div>

            {/* Stat Item 4 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Needs Follow-up</p>
              <p className="text-2xl font-bold mt-1 text-red-600 font-mono">
                {stats.needsFollowUpCount} <span className="text-xs font-normal text-slate-400">&gt;14 days</span>
              </p>
            </div>
          </section>
        )}

        {/* View Switcher, Filtering, Search Controls */}
        {viewMode !== "ats" && (
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" id="view-controls">
            {/* Search bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search-input"
                placeholder="Search by company, role, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status filtering dropdown (table and general helper) */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  id="filter-status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  {COLUMNS.map((col) => (
                    <option key={col.status} value={col.status}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* View switcher toggle */}
              <div className="flex flex-wrap rounded-xl bg-slate-100 p-1 border border-slate-200/50 shadow-sm gap-1" id="view-toggle">
                <button
                  type="button"
                  id="toggle-kanban"
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                    viewMode === "kanban"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Kanban className="h-4 w-4" />
                  <span>Board</span>
                </button>
                <button
                  type="button"
                  id="toggle-table"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <TableIcon className="h-4 w-4" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  id="toggle-resumes"
                  onClick={() => setViewMode("resumes")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                    viewMode === "resumes"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Resumes</span>
                </button>
                <button
                  type="button"
                  id="toggle-notes"
                  onClick={() => setViewMode("notes")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                    viewMode === "notes"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Notebook className="h-4 w-4" />
                  <span>Notes &amp; Wishlist</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Main Views Content */}
        <AnimatePresence mode="wait">
          {viewMode === "kanban" ? (
            <motion.div
              key="kanban-board"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${
                COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).length === 1 ? "lg:grid-cols-1 max-w-md mx-auto w-full" : 
                COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).length === 2 ? "lg:grid-cols-2 max-w-3xl mx-auto w-full" : 
                COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).length === 3 ? "lg:grid-cols-3" : 
                COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).length === 4 ? "lg:grid-cols-4" : 
                "lg:grid-cols-5"
              } items-start`}
              id="kanban-view"
            >
              {COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).map((column) => {
                const filteredApps = sortedAndFilteredApplications.filter((app) => app.status === column.status);

                return (
                  <div
                    key={column.status}
                    className={`rounded-2xl border ${column.border} ${column.bg} p-4 flex flex-col h-full min-h-[500px] shadow-sm`}
                    id={`kanban-col-${column.status.replace("/", "-")}`}
                  >
                    {/* Column Header */}
                    <div className="mb-4 flex items-center justify-between pb-2 border-b border-slate-200/50">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                        <h3 className="font-display font-bold text-slate-800 text-sm tracking-wide">
                          {column.title}
                        </h3>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold font-mono ${column.lightBg} ${column.text}`}>
                        {filteredApps.length}
                      </span>
                    </div>

                    {/* Column Items list */}
                    <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[70vh]">
                      {filteredApps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/60 p-6 text-center text-slate-400">
                          <p className="text-xs">No items found</p>
                        </div>
                      ) : (
                        filteredApps.map((app) => {
                          const hasDeadlineAlert = isDeadlineClose(app);
                          const hasNeedsFollowUp = needsFollowUp(app);

                          // Style variables based on the "Sleek Interface" theme instructions
                          let wrapperClass = "group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between border cursor-grab active:cursor-grabbing";
                          let topBadgeText = "";
                          let topBadgeClass = "text-xs font-medium text-slate-400";

                          if (app.status === "Applied") {
                            wrapperClass += " bg-white border-slate-200 hover:border-indigo-300";
                            topBadgeText = `${app.source === "Other" && app.customSource ? app.customSource : app.source} • ${getDaysSince(app.dateApplied)}d ago`;
                          } else if (app.status === "OA/Screening") {
                            wrapperClass += " bg-white border-blue-200 border-t-4 border-t-blue-500";
                            topBadgeText = `Take-home • ${getDaysSince(app.dateApplied) === 0 ? "Today" : `${getDaysSince(app.dateApplied)}d ago`}`;
                            topBadgeClass = "text-xs font-medium text-blue-500";
                          } else if (app.status === "Interview") {
                            wrapperClass += " bg-white border-purple-200 border-t-4 border-t-purple-500";
                            topBadgeText = `Final Loop • ${getDaysSince(app.dateApplied)}d ago`;
                            topBadgeClass = "text-xs font-medium text-purple-500";
                          } else if (app.status === "Offer") {
                            wrapperClass += " bg-white border-green-200 border-t-4 border-t-green-500 ring-2 ring-green-100";
                            topBadgeText = "Decision • Pending";
                            topBadgeClass = "text-xs font-medium text-green-600";
                          } else if (app.status === "Selected") {
                            wrapperClass += " bg-gradient-to-br from-white to-cyan-50/20 border-cyan-200 border-t-4 border-t-cyan-500 ring-2 ring-cyan-100/60 shadow-xs";
                            topBadgeText = "🎉 Selected!";
                            topBadgeClass = "text-xs font-bold text-cyan-600 animate-pulse";
                          } else if (app.status === "Rejected") {
                            wrapperClass += " bg-slate-100 border-slate-200 opacity-60";
                            topBadgeText = `${app.source === "Other" && app.customSource ? app.customSource : app.source} • Closed`;
                            topBadgeClass = "text-xs font-medium text-slate-400";
                          }

                          return (
                            <motion.div
                              layout
                              key={app.id}
                              id={`card-${app.id}`}
                              className={wrapperClass}
                            >
                              {/* Card Content */}
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <span className={topBadgeClass}>{topBadgeText}</span>
                                  {hasDeadlineAlert && app.status !== "Rejected" && app.status !== "Offer" && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-tighter">
                                      Deadline Soon
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-start justify-between gap-1">
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-[15px] leading-tight break-words">
                                      {app.company}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-0.5 break-words">
                                      {app.role}
                                    </p>
                                  </div>

                                  {/* Quick Action Icons */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => openEditApplicationModal(app)}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                      title="Edit job"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteApplication(app.id)}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                                      title="Delete job"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Metadata details row */}
                                <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-slate-500">
                                  {app.location && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                      <span className="truncate">{app.location}</span>
                                    </div>
                                  )}
                                  {app.salaryRange && app.status !== "Offer" && (
                                    <div className="flex items-center gap-1.5">
                                      <IndianRupee className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                      <span className="truncate font-mono">{app.salaryRange}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Offer salary badges */}
                                {app.status === "Offer" && app.salaryRange && (
                                  <div className="mt-3 flex flex-wrap gap-1">
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded">
                                      {app.salaryRange} Base
                                    </span>
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded">
                                      RSUs / Perks
                                    </span>
                                  </div>
                                )}

                                {/* OA screening deadline box */}
                                {app.status === "OA/Screening" && app.deadline && (
                                  <div className="mt-3 bg-blue-50 p-2 rounded text-[10px] text-blue-700 font-medium">
                                    Due: {app.deadline}
                                  </div>
                                )}

                                {/* Notes excerpt if present */}
                                {app.notes && (
                                  <p className="mt-3 line-clamp-2 rounded bg-slate-50 p-2 text-[11px] leading-normal text-slate-500">
                                    {app.notes}
                                  </p>
                                )}
                              </div>

                              {/* Alert Flags / Status dropdown row */}
                              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                                {/* Dynamic Alerts Indicators */}
                                <div className="flex flex-wrap gap-1.5">
                                  {/* Needs Follow-Up status flag */}
                                  {hasNeedsFollowUp && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span>Needs Follow-up</span>
                                    </span>
                                  )}

                                  {/* Clickable Resume Guide & ATS Score badge */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAtsAppId(app.id);
                                      setViewMode("ats");
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="inline-flex items-center gap-1 rounded bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100 cursor-pointer transition-all shadow-2xs"
                                    title="Optimize this resume with ATS Suite"
                                  >
                                    <Sparkles className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                                    <span>
                                      {(() => {
                                        const score = calculateAtsScoreForApp(app, atsResumeText);
                                        return score !== null ? `ATS Match: ${score}%` : "ATS Suite";
                                      })()}
                                    </span>
                                  </button>

                                  {/* Link if URL present */}
                                  {app.url && (
                                    <a
                                      href={app.url}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                                    >
                                      <span>Job Link</span>
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>

                                {/* Rapid Switch Dropdown */}
                                <div className="relative mt-1">
                                  <select
                                    value={app.status}
                                    onChange={(e) => handleStatusChange(app.id, e.target.value as JobStatus)}
                                    className="w-full bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                                  >
                                    {COLUMNS.map((col) => (
                                      <option key={col.status} value={col.status}>
                                        Move: {col.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : viewMode === "table" ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              id="table-view-container"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left" id="table-view">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Company & Role</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Salary Info</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort("dateApplied")}>
                        <div className="flex items-center gap-1.5">
                          <span>Date Applied</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort("deadline")}>
                        <div className="flex items-center gap-1.5">
                          <span>Deadline</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort("status")}>
                        <div className="flex items-center gap-1.5">
                          <span>Status</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {sortedAndFilteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                          <Briefcase className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-sm font-medium">No job applications match the filters.</p>
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredApplications.map((app) => {
                        const hasDeadlineAlert = isDeadlineClose(app);
                        const hasNeedsFollowUp = needsFollowUp(app);
                        const columnInfo = COLUMNS.find((col) => col.status === app.status);

                        return (
                          <tr key={app.id} id={`row-${app.id}`} className="hover:bg-slate-50/50 transition-colors group">
                            {/* Company & Role */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  {app.company}
                                  {app.url && (
                                    <a
                                      href={app.url}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="text-slate-400 hover:text-slate-900"
                                      title="Open posting"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </span>
                                <span className="text-xs text-slate-500 mt-0.5">{app.role}</span>
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAtsAppId(app.id);
                                      setViewMode("ats");
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="inline-flex items-center gap-1 rounded bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100 transition-colors cursor-pointer shadow-2xs"
                                    title="Open in Resume & ATS Suite"
                                  >
                                    <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
                                    <span>
                                      {(() => {
                                        const score = calculateAtsScoreForApp(app, atsResumeText);
                                        return score !== null ? `ATS Match: ${score}%` : "ATS Suite";
                                      })()}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Location */}
                            <td className="px-6 py-4">
                              <span className="text-slate-600">{app.location || "—"}</span>
                            </td>

                            {/* Salary Info */}
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs text-slate-600">{app.salaryRange || "—"}</span>
                            </td>

                            {/* Date Applied */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-slate-700">{app.dateApplied}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase font-mono">
                                  {getDaysSince(app.dateApplied)}d ago
                                </span>
                              </div>
                            </td>

                            {/* Deadline */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className={hasDeadlineAlert ? "text-rose-600 font-semibold" : "text-slate-700"}>
                                  {app.deadline || "—"}
                                </span>
                                {hasDeadlineAlert && (
                                  <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 uppercase tracking-wider animate-pulse border border-rose-100">
                                    Urgent
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Source */}
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {app.source === "Other" && app.customSource ? app.customSource : app.source}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <select
                                  value={app.status}
                                  onChange={(e) => handleStatusChange(app.id, e.target.value as JobStatus)}
                                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${
                                    columnInfo?.lightBg || "bg-slate-50"
                                  } ${columnInfo?.text || "text-slate-700"} ${columnInfo?.border || "border-slate-200"}`}
                                >
                                  {COLUMNS.map((col) => (
                                    <option key={col.status} value={col.status}>
                                      {col.title}
                                    </option>
                                  ))}
                                </select>
                                {hasNeedsFollowUp && (
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                                    <Clock className="h-3 w-3" />
                                    <span>Stale</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditApplicationModal(app)}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                  title="Edit application"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteApplication(app.id)}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="Delete application"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : viewMode === "profile" ? (
            <motion.div
              key="profile-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 animate-in fade-in duration-200"
              id="profile-view"
            >
              {/* Header profile banner */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 relative opacity-90" />
                <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-5 -mt-12">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg border-4 border-white dark:border-slate-900 select-none">
                      {userProfile.name ? userProfile.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="text-center md:text-left space-y-1 text-slate-800 dark:text-slate-100">
                      <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{userProfile.name}</h2>
                        <span className="inline-flex self-center md:self-auto rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wide">
                          Verified Profile
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{userProfile.title}</p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-450 dark:text-slate-500 mt-2 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{userProfile.location}</span>
                        </div>
                        <div className="h-1 w-1 bg-slate-300 dark:bg-slate-750 rounded-full hidden sm:block" />
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>{userProfile.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProfileEditOpen(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer transform active:scale-95 shrink-0"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile Details</span>
                  </button>
                </div>
              </div>

              {/* Bento Grid layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1: Contact & Bio */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <User className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        Bio & Contact
                      </h3>
                    </div>
                    
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Location
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.location}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Email Address
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Professional Bio
                        </span>
                        <p className="text-slate-600 dark:text-slate-350 leading-relaxed italic bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/30 dark:border-slate-800/50 mt-1">
                          "{userProfile.bio || "No professional bio provided yet."}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Professional Details */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Briefcase className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        Target Role & Skills
                      </h3>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Headline / Title
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{userProfile.title}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Target Role
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{userProfile.targetRole}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                          Key Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(userProfile.skills || "").split(",").filter(Boolean).map((s: string, idx: number) => (
                            <span 
                              key={idx} 
                              className="bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200/50 dark:border-slate-800/60"
                            >
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Integrations & Personalization */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Sparkles className="h-4.5 w-4.5 text-fuchsia-600 dark:text-fuchsia-400" />
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        Smart Personalization
                      </h3>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {userProfile.linkedinUrl && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            LinkedIn Profile
                          </span>
                          <a 
                            href={userProfile.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <span>View LinkedIn Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 p-4 rounded-2xl space-y-2">
                        <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          LinkedIn Personalization Active
                        </h4>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                          Whenever you generate a LinkedIn Outreach template under the **Resume &amp; ATS Suite**, the application will dynamically replace placeholders with your full name: <strong className="font-bold text-indigo-900 dark:text-indigo-200">"{userProfile.name}"</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            ) : viewMode === "resumes" ? (
            <motion.div
              key="resumes-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 text-slate-800 dark:text-slate-100 animate-in fade-in duration-200"
              id="resumes-view"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Header section with Plus popup trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderGit className="h-5 w-5 text-indigo-500" />
                      Resume Storage Vault
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Upload your latest resumes. Select which resume is currently active to use during ATS scans. There is no limit to adding resumes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUploadingResume(true)}
                    className="sm:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs shrink-0"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Upload Resume</span>
                  </button>
                </div>

                {/* Resumes List down */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Stored Documents ({resumes.length})
                  </h4>

                  {resumes.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                      <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Resumes Found</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Your storage vault is empty. Click "Upload Resume" to add professional resumes to your profile.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {resumes.map((resume) => {
                        const isSel = resume.isSelected;
                        return (
                          <div
                            key={resume.id}
                            className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border transition-all ${
                              isSel
                                ? "border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/10"
                                : "border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <div className={`p-3 rounded-xl ${
                                  isSel 
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400" 
                                    : "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                                }`}>
                                  <FileText className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                                    {resume.name}
                                  </h4>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                    <span className="font-mono">{resume.fileSize}</span>
                                    <span>•</span>
                                    <span>Uploaded: {resume.uploadedAt}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {isSel ? (
                                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Active for ATS
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResumes(prev =>
                                        prev.map(r => ({ ...r, isSelected: r.id === resume.id }))
                                      );
                                    }}
                                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-800 dark:hover:text-indigo-400 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                                  >
                                    Activate
                                  </button>
                                )}

                                {resumeIdToDelete === resume.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Confirm?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const filtered = resumes.filter(r => r.id !== resume.id);
                                        if (isSel && filtered.length > 0) {
                                          filtered[0].isSelected = true;
                                        }
                                        setResumes(filtered);
                                        setResumeIdToDelete(null);
                                        setNotifications(prev => [
                                          {
                                            id: `notif-${Date.now()}`,
                                            title: "Resume Deleted",
                                            message: `"${resume.name}" has been removed from storage.`,
                                            time: "Just now",
                                            isRead: false,
                                            type: "info"
                                          },
                                          ...prev
                                        ]);
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setResumeIdToDelete(null)}
                                      className="px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setResumeIdToDelete(resume.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer transition-colors"
                                    title="Delete resume"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Collapsible Content Preview */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                              <details className="group">
                                <summary className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer list-none flex items-center gap-1 select-none">
                                  <ChevronRight className="h-3.5 w-3.5 transform transition-transform group-open:rotate-90" />
                                  <span>View Extracted Text Preview</span>
                                </summary>
                                <div className="mt-2.5">
                                  <pre className="p-4 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800">
                                    {resume.content || "Empty content detected."}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Popup modal for resume upload */}
              <AnimatePresence>
                {isUploadingResume && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
                    <div 
                      className="absolute inset-0 cursor-default"
                      onClick={() => setIsUploadingResume(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl p-6 flex flex-col gap-5 z-10 max-h-[90vh]"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 shrink-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Upload className="h-4.5 w-4.5 text-indigo-500" />
                          Resume Storage Vault
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsUploadingResume(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg cursor-pointer"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Select a document file in <strong>.txt, .pdf, or .docx</strong> format. The system will automatically extract plain text content for ATS checks.
                        </p>

                        <div id="drag-drop-container-vault" className="shrink-0">
                          <label
                            htmlFor="vault-resume-upload-input"
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/5 dark:bg-slate-900/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-3xs"
                          >
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
                              <Upload className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                Click to upload or drag &amp; drop
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5">
                                Supports TXT, PDF, or Word DOCX formats
                              </span>
                            </div>
                            <input
                              type="file"
                              id="vault-resume-upload-input"
                              accept=".txt,.pdf,.docx"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const txt = event.target?.result;
                                  if (typeof txt === "string") {
                                    const cleaned = file.name.endsWith(".txt") 
                                      ? txt 
                                      : txt.replace(/[^\x20-\x7E\s]/g, " ").replace(/\s+/g, " ");
                                    
                                    const newResume = {
                                      id: `resume-${Date.now()}`,
                                      name: file.name,
                                      fileSize: sizeStr,
                                      fileType: file.name.split('.').pop() || 'txt',
                                      uploadedAt: new Date().toISOString().split("T")[0],
                                      isSelected: true,
                                      content: cleaned
                                    };
                                    
                                    setResumes(prev => {
                                      const deactivated = prev.map(r => ({ ...r, isSelected: false }));
                                      return [newResume, ...deactivated];
                                    });
                                    
                                    setNotifications(prev => [
                                      {
                                        id: `notif-${Date.now()}`,
                                        title: "Resume Sync Completed",
                                        message: `"${file.name}" uploaded & activated in ATS Suite successfully.`,
                                        time: "Just now",
                                        isRead: false,
                                        type: "success"
                                      },
                                      ...prev
                                    ]);
                                  }
                                };
                                reader.readAsText(file);
                              }}
                            />
                          </label>
                        </div>

                        {/* List of resumes right inside the plus popup */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Your Stored Resumes ({resumes.length})
                          </h4>
                          
                          {resumes.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs italic">
                              No resumes uploaded yet. Drag &amp; drop a file above to add!
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {resumes.map((resume) => {
                                const isSel = resume.isSelected;
                                return (
                                  <div
                                    key={resume.id}
                                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                      isSel 
                                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 ring-1 ring-indigo-500/20" 
                                        : "bg-slate-50/45 dark:bg-slate-900/30 border-slate-100 dark:border-slate-700/60 hover:border-slate-200 dark:hover:border-slate-650"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <FileText className={`h-4 w-4 shrink-0 ${isSel ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-800 dark:text-slate-250 truncate" title={resume.name}>
                                          {resume.name}
                                        </p>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                                          {resume.fileSize} • Uploaded {resume.uploadedAt}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isSel ? (
                                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                                          <Check className="h-2.5 w-2.5" />
                                          Active
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setResumes(prev =>
                                              prev.map(r => ({ ...r, isSelected: r.id === resume.id }))
                                            );
                                          }}
                                          className="px-2.5 py-0.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-800 dark:hover:text-indigo-400 rounded-lg text-[10px] font-bold cursor-pointer transition-all bg-white dark:bg-slate-800"
                                        >
                                          Activate
                                        </button>
                                      )}

                                      {resumeIdToDelete === resume.id ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Confirm?</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const filtered = resumes.filter(r => r.id !== resume.id);
                                              if (isSel && filtered.length > 0) {
                                                filtered[0].isSelected = true;
                                              }
                                              setResumes(filtered);
                                              setResumeIdToDelete(null);
                                              setNotifications(prev => [
                                                {
                                                  id: `notif-${Date.now()}`,
                                                  title: "Resume Deleted",
                                                  message: `"${resume.name}" has been removed from storage.`,
                                                  time: "Just now",
                                                  isRead: false,
                                                  type: "info"
                                                },
                                                ...prev
                                              ]);
                                            }}
                                            className="px-2 py-0.5 text-[9px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors"
                                          >
                                            Delete
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setResumeIdToDelete(null)}
                                            className="px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setResumeIdToDelete(resume.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end border-t border-slate-100 dark:border-slate-700 pt-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsUploadingResume(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : viewMode === "notes" ? (
            <motion.div
              key="notes-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 text-slate-800 dark:text-slate-100 animate-in fade-in duration-200"
              id="notes-view"
            >
              <CareerNotesView
                userNotes={userNotes}
                setUserNotes={setUserNotes}
                setNotifications={setNotifications}
              />
            </motion.div>
          ) : (
            <motion.div
              key="ats-optimizer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
              id="ats-view"
            >
              {/* Section Grid: ATS Resume File Uploader & Job Description Keyword Matcher */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="ats-core-suite-container">
                {/* Left Side: Inputs & File Uploads */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-2">
                      ATS Compatibility Checker
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Upload your resume file and paste a target job description. Our AI will extract the key term requirements from the description and score your resume's keyword overlap to provide instant optimization recommendations.
                    </p>
                  </div>

                  {/* Optional Target Company Preference */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Target Company Preference (Optional)</span>
                      </label>
                      {prefCompanyName && (
                        <button
                          type="button"
                          onClick={() => setPrefCompanyName("")}
                          className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Enter the name of your target company. If provided, all tools (resume scans, optimized bullets, interview questions, outreach drafts) will tailor specifically to this company.
                    </p>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={prefCompanyName}
                        onChange={(e) => setPrefCompanyName(e.target.value)}
                        placeholder="e.g. Google, Stripe, Vercel"
                        className="w-full text-xs bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 px-3.5 py-2 pl-9 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Briefcase className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>

                  {isAnalyzingResume && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50/75 border border-indigo-100 p-3 rounded-xl animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                      <span>Gemini is conducting deep keyword extraction & structural matching...</span>
                    </div>
                  )}

                  {/* Resume File Upload Widget */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Upload Resume File (.txt, .pdf, .docx)
                    </label>

                    {uploadedFileName ? (
                      <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 flex flex-col gap-3 shadow-3xs">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 text-indigo-700 p-2 rounded-xl">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                                {uploadedFileName}
                              </p>
                              <span className="text-[10px] font-semibold text-slate-400 block font-mono">
                                Size: {uploadedFileSize}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Uploaded
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedFileName("");
                                setUploadedFileSize("");
                                setAtsResumeText("");
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible extracted text preview */}
                        <div className="border-t border-slate-200/50 pt-2.5">
                          <button
                            type="button"
                            onClick={() => setShowResumePreview(!showResumePreview)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            <span>{showResumePreview ? "Hide" : "Show"} Extracted Resume Text ({atsResumeText.split(/\s+/).length} words)</span>
                            <ChevronDown className={`h-3 w-3 transform transition-transform ${showResumePreview ? "rotate-180" : ""}`} />
                          </button>

                          {showResumePreview && (
                            <textarea
                              value={atsResumeText}
                              onChange={(e) => setAtsResumeText(e.target.value)}
                              rows={5}
                              className="w-full mt-2 rounded-xl border border-slate-200 bg-white p-3 text-[10px] font-mono text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300 leading-normal"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div id="drag-drop-container">
                        <label
                          htmlFor="ats-resume-upload-input"
                          className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 shadow-3xs"
                        >
                          <Upload className="h-6 w-6 text-indigo-500 animate-bounce" />
                          <div className="text-center">
                            <span className="text-xs font-bold text-slate-700 block">
                              Click to upload or drag &amp; drop
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Supports raw PDF, Word, or TXT formats
                            </span>
                          </div>
                          <input
                            type="file"
                            id="ats-resume-upload-input"
                            accept=".txt,.pdf,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadedFileName(file.name);
                              setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const txt = event.target?.result;
                                if (typeof txt === "string") {
                                  // Strip binary characters if uploaded .pdf or .docx directly
                                  const cleaned = file.name.endsWith(".txt") 
                                    ? txt 
                                    : txt.replace(/[^\x20-\x7E\s]/g, " ").replace(/\s+/g, " ");
                                  setAtsResumeText(cleaned);
                                }
                              };
                              reader.readAsText(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Paste Job Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Paste Job Description
                      </label>
                      {atsJobDescriptionText && (
                        <button
                          type="button"
                          onClick={() => setAtsJobDescriptionText("")}
                          className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Clear Description
                        </button>
                      )}
                    </div>
                    <textarea
                      value={atsJobDescriptionText}
                      onChange={(e) => setAtsJobDescriptionText(e.target.value)}
                      placeholder="Paste the target job description details here..."
                      rows={8}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Trigger Analysis Button */}
                  <button
                    type="button"
                    disabled={isAnalyzingResume}
                    onClick={handleRunAtsAnalysis}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:bg-slate-100 disabled:text-slate-400 transition-all transform active:scale-98"
                  >
                    {isAnalyzingResume ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Running Deep Keyword Extraction &amp; ATS Score...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span>Run ATS Match &amp; Keyword Analyzer</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Side: ATS Evaluation & Score Report */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-0.5">
                          ATS Score Alignment Report
                        </h3>
                        <span className="text-[10px] text-indigo-600 uppercase font-mono tracking-wider font-extrabold block">
                          Real-Time Keyword &amp; Match Analysis
                        </span>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        Dynamic Checking
                      </span>
                    </div>

                    {/* Compatibility Score Circular Gauge */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="md:col-span-5 flex flex-col items-center justify-center">
                        <div className="relative flex items-center justify-center">
                          <svg className="w-28 h-28">
                            <circle
                              className="text-slate-200"
                              strokeWidth="7"
                              stroke="currentColor"
                              fill="transparent"
                              r="46"
                              cx="56"
                              cy="56"
                            />
                            <circle
                              className={`transition-all duration-500 ${
                                realTimeAtsAnalysis.score >= 75
                                  ? "text-emerald-500"
                                  : realTimeAtsAnalysis.score >= 50
                                  ? "text-amber-500"
                                  : "text-rose-500"
                              }`}
                              strokeWidth="7"
                              strokeDasharray={289}
                              strokeDashoffset={289 - (289 * realTimeAtsAnalysis.score) / 100}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="46"
                              cx="56"
                              cy="56"
                              transform="rotate(-90 56 56)"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-2xl font-black font-mono text-slate-800">{realTimeAtsAnalysis.score}%</span>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Match</span>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-7 space-y-2 text-left">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          realTimeAtsAnalysis.score >= 75
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : realTimeAtsAnalysis.score >= 50
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          {realTimeAtsAnalysis.score >= 75
                            ? "Recruiter Grade - Strong Overlap"
                            : realTimeAtsAnalysis.score >= 50
                            ? "Medium Overlap - Tailor further"
                            : "Low Compatibility - Missing critical tech"}
                        </span>
                        <p className="text-xs text-slate-500 leading-normal font-sans">
                          {realTimeAtsAnalysis.score >= 75 
                            ? "Excellent fit! Your resume matches a significant portion of the skills found in the job description." 
                            : "Consider editing your bullet achievements to explicitly reference missing keywords listed below to boost your real-time score."}
                        </p>
                      </div>
                    </div>

                    {/* Extracted Term Mapping */}
                    <div className="space-y-4">
                      {/* Matched Panel */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            Matched Keywords ({realTimeAtsAnalysis.matched.length})
                          </span>
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                          {realTimeAtsAnalysis.matched.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic p-1">No matched terms detected yet. Paste a job and hit Run!</span>
                          ) : (
                            realTimeAtsAnalysis.matched.map((kw, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 font-sans"
                              >
                                <Check className="h-3 w-3" />
                                {kw}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Missing Panel */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            Missing Tech &amp; Requirements ({realTimeAtsAnalysis.missing.length})
                          </span>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                          {realTimeAtsAnalysis.missing.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic p-1">All primary keywords matched! Excellent!</span>
                          ) : (
                            realTimeAtsAnalysis.missing.map((kw, idx) => {
                              const isSelected = selectedMissingKeyword === kw || (!selectedMissingKeyword && idx === 0);
                              return (
                                <span
                                  key={idx}
                                  onClick={() => setSelectedMissingKeyword(kw)}
                                  title="Click to view tailoring tip & suggestions"
                                  className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all duration-150 font-sans ${
                                    isSelected 
                                      ? "bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-200/50 scale-102" 
                                      : "bg-amber-50 border border-amber-100 text-amber-800 hover:bg-amber-100"
                                  }`}
                                >
                                  + {kw}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Help the user make a change (Interactive Helper Box) */}
                      {realTimeAtsAnalysis.missing.length > 0 && (
                        <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-left">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider">
                              Interactive Tailoring Helper: {selectedMissingKeyword || realTimeAtsAnalysis.missing[0]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-normal">
                            Click one of these suggestions to append it to your resume and watch your score increase in real-time!
                          </p>
                          <div className="space-y-1.5 pt-1">
                            {[
                              `Designed and implemented high-performance integrations using ${selectedMissingKeyword || realTimeAtsAnalysis.missing[0]} to optimize system workflows.`,
                              `Collaborated with key stakeholders to align technical architecture with standard ${selectedMissingKeyword || realTimeAtsAnalysis.missing[0]} best practices.`
                            ].map((suggestion, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setAtsResumeText(prev => prev + `\n- ${suggestion}`);
                                  setModalAlert({
                                    title: "Accomplishment Appended!",
                                    message: `Appended suggestion containing "${selectedMissingKeyword || realTimeAtsAnalysis.missing[0]}" to your resume draft. Your score will update instantly!`,
                                    type: "success"
                                  });
                                }}
                                className="w-full text-left bg-white hover:bg-indigo-50 p-2 rounded-lg border border-slate-200/80 hover:border-indigo-300 text-xs font-medium text-slate-700 leading-relaxed cursor-pointer transition-all duration-150 flex items-start gap-1.5"
                              >
                                <span className="text-indigo-500 font-bold shrink-0 mt-0.5">+</span>
                                <span>{suggestion}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tailoring Recommendations Bullet List */}
                  <div className="border-t border-slate-100 pt-4 mt-2 space-y-2 text-left">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                        Actionable Tailoring Recommendations
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 pl-0 leading-relaxed list-none">
                      {realTimeAtsAnalysis.atsSuggestions?.slice(0, 3).map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                          <span className="font-medium text-slate-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Row 3: Related Tailoring & Preparation Tools */}
              <div className="border-t border-slate-200/60 pt-8 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-1">
                    Job Preparation &amp; Bullet Optimization Suite
                  </h3>
                  <p className="text-xs text-slate-500">
                    Leverage your target job keywords to draft outreach communications, prepare behavioral questions, and refine resume accomplishment bullets.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Tool A: Resume Bullet Point Enhancer */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">A</span>
                        <h4 className="font-bold text-slate-800 text-sm">Resume Bullet Point Enhancer</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Convert low-impact, passive responsibilities into metrics-driven accomplishments. Paste an existing resume bullet point to rewrite.
                      </p>
                      <input
                        type="text"
                        value={bulletToOptimize}
                        onChange={(e) => setBulletToOptimize(e.target.value)}
                        placeholder="e.g., Responsible for writing software features."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-medium"
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const suggested = getSuggestedWeakBullet(atsJobDescriptionText);
                            setBulletToOptimize(suggested);
                            setModalAlert({
                              title: "Bullet Loaded",
                              message: "Loaded a tailored weak bullet point based on the current Job Description.",
                              type: "success"
                            });
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          ✨ Suggest tailored weak bullet point based on Job
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <button
                        type="button"
                        disabled={isOptimizingBullet || !bulletToOptimize.trim()}
                        onClick={handleOptimizeBullet}
                        className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold py-2 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer flex items-center justify-center gap-1 transition-all"
                      >
                        {isOptimizingBullet ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Optimizing Bullet...</span>
                          </>
                        ) : (
                          <span>Optimize Achievement Bullet</span>
                        )}
                      </button>

                      {optimizedBulletResult && (
                        <div className="space-y-3 pt-2">
                          <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl text-xs text-slate-800 leading-relaxed relative">
                            <span className="block text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 font-sans mb-1">✓ Recommended Core Bullet</span>
                            <p className="font-medium">{optimizedBulletResult}</p>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(optimizedBulletResult);
                                setModalAlert({ title: "Bullet Copied!", message: "Copied the optimized bullet to your clipboard.", type: "success" });
                              }}
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:underline"
                            >
                              Copy Core Bullet
                            </button>
                          </div>

                          {optimizedBulletOptions.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              <span className="block text-[9px] uppercase tracking-wider font-bold text-indigo-700 font-sans">Three Distinct Professional Options:</span>
                              {optimizedBulletOptions.map((opt, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs text-slate-700 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[9px] uppercase text-indigo-600 tracking-wider">Option {i + 1}: {opt.type}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(opt.bullet);
                                        setModalAlert({ title: "Option Copied!", message: `Copied ${opt.type} option to your clipboard.`, type: "success" });
                                      }}
                                      className="text-[9px] text-slate-500 hover:text-indigo-600 font-bold"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <p className="font-medium leading-relaxed font-sans">{opt.bullet}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tool B: Behavioral Interview Prep */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">B</span>
                        <h4 className="font-bold text-slate-800 text-sm">Technical &amp; Behavioral Interview Prep</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Analyze target keywords for this role and generate realistic interview questions technical teams will ask you.
                      </p>
                    </div>

                    <div className="pt-2 space-y-3">
                      <button
                        type="button"
                        disabled={isGeneratingPrep}
                        onClick={handleGeneratePrep}
                        className="w-full rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 text-xs font-bold py-2 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      >
                        {isGeneratingPrep ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Formulating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                            <span>Generate 3 Interview Questions</span>
                          </>
                        )}
                      </button>

                      {prepQuestions.length > 0 && (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                          {prepQuestions.map((item, idx) => {
                            const qText = typeof item === 'string' ? item : item.question;
                            const rText = typeof item === 'string' ? '' : item.response;
                            const isExpanded = !!expandedPrepIdx[idx];

                            return (
                              <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-[11px] text-slate-700 leading-relaxed flex flex-col gap-2 shadow-3xs">
                                <div>
                                  <span className="font-bold text-slate-900 block font-sans mb-0.5">Question {idx + 1}</span>
                                  <p className="font-medium text-slate-800">{qText}</p>
                                </div>
                                
                                {rText && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedPrepIdx(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer shadow-3xs flex items-center gap-1 ${
                                        isExpanded 
                                          ? "bg-indigo-600 text-white border-indigo-600" 
                                          : "bg-white text-indigo-700 border-indigo-100 hover:bg-indigo-50"
                                      }`}
                                    >
                                      {isExpanded ? "Hide Solution" : "✓ View Best Answer"}
                                    </button>
                                  </div>
                                )}

                                {isExpanded && rText && (
                                  <div className="bg-white border border-indigo-100 shadow-sm rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-indigo-600 font-sans">
                                        <Sparkles className="h-3 w-3 animate-pulse text-indigo-500" />
                                        <span>Highly Impressive STAR Response</span>
                                      </span>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(rText);
                                          setModalAlert({ title: "Answer Copied!", message: "The professional interview response was copied to clipboard.", type: "success" });
                                        }}
                                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-100/60 cursor-pointer shadow-3xs"
                                      >
                                        <Clipboard className="h-3.5 w-3.5 text-indigo-600" />
                                        <span>Copy Response</span>
                                      </button>
                                    </div>
                                    
                                    <div className="text-[11px] text-slate-700 font-sans leading-relaxed whitespace-pre-line font-medium pr-1 max-h-48 overflow-y-auto">
                                      {rText}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tool C: Cold Outreach Message Draft */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">C</span>
                        <h4 className="font-bold text-slate-800 text-sm">LinkedIn Outreach &amp; Email Draft</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Automatically draft a short, warm outreach intro or cover letter paragraph focusing on the identified skills and company requirements.
                      </p>
                    </div>

                    <div className="pt-2 space-y-3">
                      <button
                        type="button"
                        disabled={isGeneratingOutreach}
                        onClick={handleGenerateOutreach}
                        className="w-full rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 text-xs font-bold py-2 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      >
                        {isGeneratingOutreach ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Drafting message...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                            <span>Draft Cold Outreach Message</span>
                          </>
                        )}
                      </button>

                      {outreachDraft && (
                        <div className="space-y-2">
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-700 font-mono leading-relaxed max-h-40 overflow-y-auto relative whitespace-pre-line">
                            <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 font-sans mb-1.5">Outreach Message Draft</span>
                            {outreachDraft}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(outreachDraft);
                              setModalAlert({ title: "Copied!", message: "Outreach message draft copied to clipboard.", type: "success" });
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100/80 cursor-pointer shadow-3xs"
                          >
                            <Clipboard className="h-3.5 w-3.5" />
                            <span>Copy Outreach Message</span>
                          </button>

                          {/* Highlighted Outreach Motivation Line - fully selectable/copyable now */}
                          <div className="bg-amber-50/70 border border-amber-200/40 rounded-xl p-3 text-[11px] text-amber-900 mt-2.5 shadow-3xs">
                            <p className="leading-relaxed font-medium">
                              💡 <span className="font-semibold text-amber-800">Outreach Mindset Booster:</span> Connection breeds opportunity! Every single message you send is an active step closer to landing your dream role. Reach out with absolute confidence and pride in your professional journey — you have got this! 🚀✨
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Resume & ATS Suite Guidelines (Moved to bottom of the page) */}
              <div className="border-t border-slate-200/60 pt-8" id="ats-bottom-guidelines">
                <div className="bg-gradient-to-r from-indigo-50/70 via-indigo-50/35 to-purple-50/70 rounded-2xl border border-indigo-100 p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-indigo-100/40 pb-3">
                    <div className="flex items-center gap-2 text-indigo-950 font-black text-sm uppercase tracking-wider">
                      <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                      <span>Resume &amp; ATS Suite Guidelines</span>
                    </div>
                    <div className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-100/60 shadow-xs flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Optimization Module
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white rounded-xl p-4 border border-indigo-100/40 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 mt-0.5">1</span>
                      <div>
                        <strong className="block text-slate-900 font-bold mb-0.5">Sleek, Simple Structure</strong>
                        ATS parsers scan plain left-to-right text. Avoid tables, headers/footers, icons, graphics, or multi-column layouts which scramble text data.
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-indigo-100/40 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 mt-0.5">2</span>
                      <div>
                        <strong className="block text-slate-900 font-bold mb-0.5">Keyword Match Threshold</strong>
                        Aim for a minimum of 70% keyword alignment on technologies and tools. Select any job below to compute your overlap instantly.
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-indigo-100/40 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 mt-0.5">3</span>
                      <div>
                        <strong className="block text-slate-900 font-bold mb-0.5">Metrics-Driven Impact</strong>
                        Begin experience bullets with context-rich action verbs (e.g. Optimized, Developed, Managed). Quantify achievements with concrete numbers.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Elegant Highlighted Footer with Hemanth Kattamuri */}
      <footer className="mt-auto py-8 border-t border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 shrink-0 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
            {/* User Highlighted Name with Verified badge */}
            <div className="flex items-center justify-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/30 px-4 py-2.5 rounded-2xl shadow-3xs transition-all duration-300 hover:scale-102 hover:shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created By</span>
              <span className="text-sm font-black font-display flex items-center gap-1.5 bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Hemanth Kattamuri
                <BadgeCheck className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950/60 shrink-0" title="Verified Creator" />
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL 1: ADD & EDIT APPLICATION FORM */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="modal-add-edit">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-slate-700" />
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {isEditMode ? "Edit Job Application" : "New Job Application"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleSaveApplication} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 2-Column row 1: Company & Role */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google, Stripe"
                      value={formState.company}
                      onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                      className={`w-full rounded-xl border px-3.5 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all ${
                        formErrors.company
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      }`}
                    />
                    {formErrors.company && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.company}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Job Title / Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Frontend Engineer"
                      value={formState.role}
                      onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                      className={`w-full rounded-xl border px-3.5 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all ${
                        formErrors.role
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      }`}
                    />
                    {formErrors.role && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.role}</p>
                    )}
                  </div>
                </div>

                {/* 2-Column row 2: Location & Salary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Location <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco (Hybrid), Remote"
                      value={formState.location}
                      onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Salary Range <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">₹</span>
                        <input
                          type="text"
                          placeholder="Min (e.g. 1000000)"
                          value={formState.minSalary || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setFormState({ ...formState, minSalary: val });
                          }}
                          className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-mono"
                        />
                      </div>
                      <span className="text-slate-400 font-bold px-1">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">₹</span>
                        <input
                          type="text"
                          placeholder="Max (e.g. 1500000)"
                          value={formState.maxSalary || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setFormState({ ...formState, maxSalary: val });
                          }}
                          className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column row 3: Dates */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Date Applied
                    </label>
                    <input
                      type="date"
                      required
                      value={formState.dateApplied}
                      onChange={(e) => setFormState({ ...formState, dateApplied: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Deadline <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={formState.deadline}
                      onChange={(e) => setFormState({ ...formState, deadline: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>
                </div>

                {/* 2-Column row 4: Source & Status */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Application Source
                    </label>
                    <select
                      value={formState.source}
                      onChange={(e) => setFormState({ ...formState, source: e.target.value as JobSource })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-white text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all cursor-pointer"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Company Website">Company Website</option>
                      <option value="Referral">Referral</option>
                      <option value="Other">Other</option>
                    </select>
                    {formState.source === "Other" && (
                      <div className="mt-2">
                        <label className="block text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                          Specify Other Source <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Glassdoor, Twitter, Slack"
                          value={formState.customSource}
                          onChange={(e) => setFormState({ ...formState, customSource: e.target.value })}
                          className="w-full rounded-xl border border-indigo-200 px-3.5 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all bg-indigo-50/20"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Current Status
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) => setFormState({ ...formState, status: e.target.value as JobStatus })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-white text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all cursor-pointer"
                    >
                      {COLUMNS.map((col) => (
                        <option key={col.status} value={col.status}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Job Posting URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Job Posting URL <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com/careers/job-id"
                    value={formState.url}
                    onChange={(e) => setFormState({ ...formState, url: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                  />
                </div>

                {/* Resume Keyword & ATS Suggestions */}
                {((formState.suggestedKeywords && formState.suggestedKeywords.length > 0) || (formState.atsSuggestions && formState.atsSuggestions.length > 0)) && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                      <span>Resume &amp; ATS Tailoring Guide</span>
                    </div>

                    {formState.suggestedKeywords && formState.suggestedKeywords.length > 0 && (
                      <div>
                        <span className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                          Key Resume Keywords to Include
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {formState.suggestedKeywords.map((kw, i) => (
                            <span key={i} className="inline-flex items-center rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-700">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {formState.atsSuggestions && formState.atsSuggestions.length > 0 && (
                      <div>
                        <span className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                          Actionable ATS Optimization Tips
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
                          {formState.atsSuggestions.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Notes &amp; Details <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Preparation thoughts, referral contacts, interviewed managers, follow-up ideas..."
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all resize-none"
                  />
                </div>

                {/* Actions bottom */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 hover:shadow-md transition-all active:scale-98 cursor-pointer"
                  >
                    {isEditMode ? "Save Changes" : "Save Application"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900">Delete Application?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this job application? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setApplications((prev) => prev.filter((app) => app.id !== deleteConfirmId));
                  setDeleteConfirmId(null);
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFILE DETAILS */}
      <AnimatePresence>
        {isProfileEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="modal-edit-profile">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileEditOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Update Profile Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileEditOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updated = {
                    name: (formData.get("profile-name") as string).trim(),
                    email: (formData.get("profile-email") as string).trim(),
                    title: (formData.get("profile-title") as string).trim(),
                    location: (formData.get("profile-location") as string).trim(),
                    targetRole: (formData.get("profile-target") as string).trim(),
                    skills: (formData.get("profile-skills") as string).trim(),
                    linkedinUrl: (formData.get("profile-linkedin") as string).trim(),
                    bio: (formData.get("profile-bio") as string).trim(),
                  };
                  if (!updated.name) {
                    setModalAlert({
                      title: "Name Required",
                      message: "Please enter your full name before saving.",
                      type: "error"
                    });
                    return;
                  }
                  setUserProfile(updated);
                  if (auth.currentUser && updated.name !== auth.currentUser.displayName) {
                    try {
                      await updateProfile(auth.currentUser, { displayName: updated.name });
                    } catch (err) {
                      console.error("Failed to sync display name:", err);
                    }
                  }
                  setIsProfileEditOpen(false);
                  setModalAlert({
                    title: "Profile Saved Successfully",
                    message: "Your profile details have been saved and will now be used across the workspace.",
                    type: "success"
                  });
                }}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input 
                      type="text"
                      name="profile-name"
                      required
                      defaultValue={userProfile.name}
                      placeholder="Your full name"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input 
                      type="email"
                      name="profile-email"
                      defaultValue={userProfile.email}
                      placeholder="you@example.com"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Headline / Professional Title
                    </label>
                    <input 
                      type="text"
                      name="profile-title"
                      defaultValue={userProfile.title}
                      placeholder="e.g. Software Engineer"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Target Role
                    </label>
                    <input 
                      type="text"
                      name="profile-target"
                      defaultValue={userProfile.targetRole}
                      placeholder="e.g. Full Stack Developer"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Location
                    </label>
                    <input 
                      type="text"
                      name="profile-location"
                      defaultValue={userProfile.location}
                      placeholder="City, Country"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      LinkedIn Profile URL
                    </label>
                    <input 
                      type="url"
                      name="profile-linkedin"
                      defaultValue={userProfile.linkedinUrl}
                      placeholder="https://linkedin.com/in/you"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Key Skills (comma-separated list)
                  </label>
                  <input 
                    type="text"
                    name="profile-skills"
                    defaultValue={userProfile.skills}
                    placeholder="React, TypeScript, Node.js"
                    className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Professional Bio
                  </label>
                  <textarea 
                    name="profile-bio"
                    rows={4}
                    defaultValue={userProfile.bio}
                    placeholder="A short professional summary"
                    className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium resize-none leading-relaxed"
                  />
                </div>

                {/* Actions bottom */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsProfileEditOpen(false)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-98 cursor-pointer flex items-center gap-1"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert Modal */}
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
    </div>
  );
}

interface LoginScreenProps {
  onLoginSuccess: (profile?: any) => void;
}

function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emptyProfile = {
    name: "",
    email: "",
    title: "",
    location: "",
    targetRole: "",
    skills: "",
    linkedinUrl: "",
    bio: ""
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && (!name || !title))) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      const finalProfile = {
        ...emptyProfile,
        name: isSignUp ? name : (auth.currentUser?.displayName || ""),
        email: email,
        title: isSignUp ? title : "",
      };
      onLoginSuccess(finalProfile);
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const finalProfile = {
        ...emptyProfile,
        name: user.displayName || "",
        email: user.email || "",
      };
      onLoginSuccess(finalProfile);
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-100 mb-4">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 font-display">
            {isSignUp ? "Create your account" : "Sign in to Placofy"}
          </h2>
          <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Manage your job applications, optimize ATS keywords, track interview preparations, and draft tailored outreach campaigns.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Professional Title / Headline
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-sm hover:shadow-md hover:shadow-indigo-100 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            <span>{isLoading ? "Please wait..." : (isSignUp ? "Register Account" : "Sign In to Workspace")}</span>
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold">
            <span className="bg-white px-3 text-slate-400 font-sans">Or Continue With</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer transform active:scale-95 disabled:opacity-50 font-sans shadow-xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.97 1 12 1 7.24 1 3.2 3.73 1.24 7.74l3.85 2.99C6.01 7.21 8.81 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.65-5.02 3.65-8.65z"
            />
            <path
              fill="#FBBC05"
              d="M5.09 14.75a7.16 7.16 0 0 1 0-4.5l-3.85-2.99a11.96 11.96 0 0 0 0 10.49l3.85-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.51 1.18-4.2 1.18-3.19 0-5.99-2.17-6.91-5.69L1.24 16.26C3.2 20.27 7.24 23 12 23z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsSignUp(prev => !prev)}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account yet? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}
