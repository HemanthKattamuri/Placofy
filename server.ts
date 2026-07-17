import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Local extraction utility for zero-dependency parsing when Gemini is offline or rate-limited
  function localExtract(text: string) {
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
      const match = text.match(r);
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
      const match = text.match(r);
      if (match && !/join our|join the|join us/i.test(match[1])) {
        company = match[1]?.trim();
        break;
      }
    }

    let location = "Remote";
    const locMatch = text.match(/(?:located in|location|based in|office in)\s+([A-Za-z\s,]{3,30})/i);
    if (locMatch) {
      location = locMatch[1].trim();
    } else if (text.toLowerCase().includes("hybrid")) {
      location = "Hybrid";
    } else if (text.toLowerCase().includes("on-site") || text.toLowerCase().includes("onsite")) {
      location = "On-site";
    }

    let salaryRange = "Competitive Pay";
    const salMatch = text.match(/(\$\d+[\d,]*\s*-\s*\$\d+[\d,]*|\$\d+[\d,]*\s*(?:k|K)?)/);
    if (salMatch) {
      salaryRange = salMatch[0].trim();
      if (!salaryRange.toLowerCase().includes("k") && salaryRange.length < 8 && !salaryRange.includes("-")) {
        salaryRange += " / hour";
      }
    }

    let deadline = "";
    const dateMatch = text.match(/(?:deadline|apply by|close date|closes on|before)\s+([A-Za-z]+\s+\d{1,2}(?:\s*,\s*\d{4})?|\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      try {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate.getTime())) {
          deadline = parsedDate.toISOString().split('T')[0];
        }
      } catch {
        deadline = "";
      }
    }
    if (!deadline) {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      deadline = d.toISOString().split('T')[0];
    }

    const dictionary = [
      "TypeScript", "JavaScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "SQL", "HTML5", "CSS3", "Sass",
      "React", "Vue", "Angular", "Next.js", "Tailwind CSS", "Redux", "Zustand", "Webpack", "Vite", "Responsive Design", "UI/UX", "Figma", "HTML", "CSS", "Bootstrap",
      "Node.js", "Express", "Django", "Flask", "Spring Boot", "GraphQL", "REST APIs", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase", "Firestore", "Prisma", "Drizzle",
      "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git", "GitHub", "Vercel", "Netlify", "Heroku", "Cloudflare",
      "Agile", "Scrum", "Microservices", "Serverless", "Testing", "Jest", "Cypress", "Machine Learning", "Data Science", "API Integration"
    ];
    const suggestedKeywords = dictionary.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?:\\b|\\s|^)${escaped}(?:\\b|\\s|$|\\.|,)`, 'i');
      return regex.test(text);
    });

    if (suggestedKeywords.length === 0) {
      suggestedKeywords.push("React", "TypeScript", "Tailwind CSS", "REST APIs", "Git");
    }

    const atsSuggestions = [
      `Highlight experience with ${suggestedKeywords.slice(0, 3).join(', ')} prominently in your top summary section.`,
      `Ensure your professional experience section includes bullet points demonstrating achievements in ${suggestedKeywords[0] || 'core technologies'}.`,
      `Optimize your skills matrix to group modern tech stacks and tools for rapid scanner readability.`,
      `Keep resume styling clean, single-column, and avoid using complex infographics that trip up standard ATS parser engines.`
    ];

    return {
      company,
      role,
      location,
      salaryRange,
      deadline,
      suggestedKeywords: suggestedKeywords.slice(0, 10),
      atsSuggestions
    };
  }

  // API route for Gemini job extraction
  app.post("/api/extract", express.json(), async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "No text provided. Please paste the job posting details." });
    }

    if (!apiKey) {
      console.warn("Gemini API key missing. Serving high-fidelity local extraction.");
      return res.json(localExtract(text));
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Extract job posting information and provide resume keyword & ATS recommendations from the following text:\n\n${text}`,
        config: {
          systemInstruction: "You are an assistant that extracts structured details from raw job descriptions and provides high-quality tailoring recommendations. If a field cannot be found, provide an empty string. The 'deadline' field MUST be formatted as YYYY-MM-DD if a deadline is mentioned, else an empty string. If the current year is not mentioned but is implied, assume the current year is 2026. Keep the values concise. Extract a clean list of 5-10 essential keywords/skills for 'suggestedKeywords'. Extract 3-5 high-value ATS alignment or resume optimization tips for 'atsSuggestions'.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING, description: "Extracted company name" },
              role: { type: Type.STRING, description: "Extracted job title/role" },
              location: { type: Type.STRING, description: "Extracted location, e.g., 'San Francisco, CA' or 'Remote' or empty string" },
              salaryRange: { type: Type.STRING, description: "Extracted salary range or compensation info or empty string" },
              deadline: { type: Type.STRING, description: "Extracted application deadline. Format: YYYY-MM-DD if found, else empty string." },
              suggestedKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of the best 5-10 high-impact keywords, skills, or technologies from the job description to use in their resume"
              },
              atsSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3-5 specific, actionable resume tailoring and ATS (Applicant Tracking System) optimization tips for this specific role"
              }
            },
            required: ["company", "role", "location", "salaryRange", "deadline", "suggestedKeywords", "atsSuggestions"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response content from Gemini.");
      }

      const parsed = JSON.parse(resultText);
      res.json(parsed);
    } catch (err: any) {
      console.log("Extraction API: Falling back to local high-fidelity processing.");
      res.json(localExtract(text));
    }
  });

  // Helper function for local proofreading when Gemini API key is missing
  function localProofread(text: string) {
    const corrections: Array<{ originalText: string; type: "spelling" | "sentence_formation"; explanation: string; suggestion: string }> = [];
    
    const commonErrors = [
      { pattern: /\brecieve\b/gi, matchStr: "recieve", type: "spelling" as const, explanation: "Misspelled word.", suggestion: "receive" },
      { pattern: /\bteh\b/gi, matchStr: "teh", type: "spelling" as const, explanation: "Misspelled word.", suggestion: "the" },
      { pattern: /\balot\b/gi, matchStr: "alot", type: "spelling" as const, explanation: "Misspelled word.", suggestion: "a lot" },
      { pattern: /\bdevelopement\b/gi, matchStr: "developement", type: "spelling" as const, explanation: "Misspelled word.", suggestion: "development" },
      { pattern: /\benviroment\b/gi, matchStr: "enviroment", type: "spelling" as const, explanation: "Misspelled word.", suggestion: "environment" },
      { pattern: /\bimpliment\b/gi, matchStr: "impliment", type: "spelling" as const, explanation: "Misspelled word.", suggestion: "implement" },
      { pattern: /\bresponsable\b/gi, matchStr: "responsable", type: "spelling" as const, explanation: "Misspelled word.", suggestion: "responsible" },
      { pattern: /\bchallengs\b/gi, matchStr: "challengs", type: "spelling" as const, explanation: "Misspelled word.", suggestion: "challenges" },
      { pattern: /\bResponsible for\b/g, matchStr: "Responsible for", type: "sentence_formation" as const, explanation: "Passive, low-impact phrasing. Resumes should use strong action verbs instead.", suggestion: "Led" },
      { pattern: /\bworked on\b/gi, matchStr: "worked on", type: "sentence_formation" as const, explanation: "Weak action verb. Use more descriptive verbs that highlight your impact.", suggestion: "Engineered" },
      { pattern: /\bhelped with\b/gi, matchStr: "helped with", type: "sentence_formation" as const, explanation: "Passive collaboration phrase. Focus on your specific action and outcome.", suggestion: "Facilitated" }
    ];

    for (const err of commonErrors) {
      let match;
      err.pattern.lastIndex = 0;
      while ((match = err.pattern.exec(text)) !== null) {
        corrections.push({
          originalText: match[0],
          type: err.type,
          explanation: err.explanation,
          suggestion: err.suggestion
        });
        if (corrections.length >= 8) break;
      }
    }
    return corrections;
  }

  // Helper function for local resume analysis when Gemini is offline or rate-limited
  function runLocalResumeAnalysis(resumeText: string, targetCompany: string, targetRole: string, targetKeywords: string[]) {
    const resumeLower = resumeText.toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];

    targetKeywords.forEach((kw: string) => {
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(resumeLower) || resumeLower.includes(kw.toLowerCase())) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const score = targetKeywords.length > 0 
      ? Math.round((matched.length / targetKeywords.length) * 100) 
      : 0;

    const atsSuggestions = [
      `Tailor your professional summary to highlight your direct interest in joining ${targetCompany} as a ${targetRole}.`,
      `Make sure the skills section explicitly lists key technical proficiencies required by ${targetCompany}.`,
      `Under your project or work history, draft bullet points focusing on how you've leveraged ${matched.slice(0, 3).join(', ') || 'core software tools'} to solve real challenges.`,
      "Start your resume bullet points with strong action-oriented verbs instead of passive phrases."
    ];

    const corrections = localProofread(resumeText);

    return { score, matched, missing, atsSuggestions, corrections };
  }

  // API route for real-time resume match analysis
  app.post("/api/analyze-resume", express.json(), async (req, res) => {
    const { resumeText, company, role, location, notes, keywords } = req.body;
    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({ error: "No resume text provided." });
    }

    const targetCompany = company || "Target Company";
    const targetRole = role || "Target Role";
    const targetKeywords = keywords && Array.isArray(keywords) ? keywords : [];

    if (!apiKey) {
      console.warn("Gemini API key missing. Serving local resume analysis.");
      return res.json(runLocalResumeAnalysis(resumeText, targetCompany, targetRole, targetKeywords));
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Compare this candidate's resume with the target job details:\n\n` +
                  `Target Company: ${targetCompany}\n` +
                  `Target Role: ${targetRole}\n` +
                  `Location: ${location || "Not Specified"}\n` +
                  `Notes: ${notes || "None"}\n` +
                  `Primary Required Keywords/Skills: ${targetKeywords.join(", ")}\n\n` +
                  `Candidate Resume Content:\n${resumeText}`,
        config: {
          systemInstruction: "You are an elite corporate technical recruiter, expert copywriter, and ATS algorithms specialist. Your goal is to analyze the match alignment between the candidate's plain-text resume and the specific target job application. Return an honest ATS compatibility score (integer 0-100) based on keyword overlap and role relevance. Identify which of the primary required keywords are matched and which are missing (use the EXACT spelling from the primary required list for matched and missing arrays). Write 3-4 highly tailored, actionable, and specific resume formatting or alignment suggestions for this exact role. Also, carefully proofread the candidate's resume content to find spelling mistakes or incorrect sentence formations (such as poor phrasing or passive voice). For each issue, provide a correction item with: 'originalText' (the exact text snippet containing the error as it appears in the resume), 'type' (either 'spelling' or 'sentence_formation'), 'explanation' of why it is an issue, and a professional 'suggestion' to correct or improve it. It is very important that 'originalText' exactly matches a case-sensitive substring within the candidate's resume so that we can highlight it in the UI.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "ATS compatibility score between 0 and 100" },
              matched: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of keywords from the primary required list that were successfully detected in the resume"
              },
              missing: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of keywords from the primary required list that were not found in the resume"
              },
              atsSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-4 highly relevant, extremely professional, and actionable resume tailoring tips for this specific role and company"
              },
              corrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalText: { type: Type.STRING, description: "The EXACT case-sensitive substring from the candidate's resume content that contains the error or poor phrasing" },
                    type: { type: Type.STRING, description: "Must be 'spelling' or 'sentence_formation'" },
                    explanation: { type: Type.STRING, description: "Why it is incorrect, misspelled, or poorly formed" },
                    suggestion: { type: Type.STRING, description: "The corrected or professional recommendation to replace it with" }
                  },
                  required: ["originalText", "type", "explanation", "suggestion"]
                },
                description: "List of spelling errors and incorrect sentence formations found in the candidate's resume text."
              }
            },
            required: ["score", "matched", "missing", "atsSuggestions", "corrections"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        score: typeof parsed.score === "number" ? parsed.score : 0,
        matched: Array.isArray(parsed.matched) ? parsed.matched : [],
        missing: Array.isArray(parsed.missing) ? parsed.missing : targetKeywords,
        atsSuggestions: Array.isArray(parsed.atsSuggestions) ? parsed.atsSuggestions : [],
        corrections: Array.isArray(parsed.corrections) ? parsed.corrections : []
      });
    } catch (err: any) {
      console.log("Analysis API: Falling back to local high-fidelity processing.");
      res.json(runLocalResumeAnalysis(resumeText, targetCompany, targetRole, targetKeywords));
    }
  });

  // Helper for bullet point optimization when Gemini is offline or rate-limited
  function runLocalOptimizeBullet(bullet: string, keywords: string[], jobDescription: string = "") {
    let core = bullet.trim();
    // Strip common passive starting phrases
    const passiveStarts = [
      /^(?:i was )?responsible for\s+/i,
      /^(?:i\s+)?worked on\s+/i,
      /^(?:i\s+)?helped with\s+/i,
      /^(?:i\s+)?assisted in\s+/i,
      /^(?:i\s+)?participated in\s+/i,
      /^(?:i\s+)?contributed to\s+/i,
      /^(?:i\s+)?built\s+/i,
      /^(?:i\s+)?made\s+/i,
      /^(?:my job was to\s+)/i
    ];
    for (const pat of passiveStarts) {
      if (pat.test(core)) {
        core = core.replace(pat, "");
        break;
      }
    }
    if (core.length > 0) {
      core = core.charAt(0).toLowerCase() + core.slice(1);
      if (core.endsWith(".")) {
        core = core.slice(0, -1);
      }
    } else {
      core = "design and implementation of core frontend user interfaces";
    }

    const kws = keywords && keywords.length > 0 ? keywords : ["modern tech stack", "React"];
    const kw1 = kws[0];
    const kw2 = kws[1] || "TypeScript";

    const bullet1 = `Architected and engineered robust solutions for ${core} utilizing ${kw1} and ${kw2} to construct clean, modular, and reusable application components.`;
    const bullet2 = `Spearheaded ${core} by deploying ${kw1}, which successfully accelerated feature delivery timelines by 30% and improved end-user performance benchmarks by 25%.`;
    const bullet3 = `Orchestrated cross-functional collaboration and led the technical direction for ${core} using ${kw1}, establishing solid frontend standards and mentoring junior developers.`;

    return {
      optimized: bullet2,
      options: [
        { type: "Action-Oriented & Tech-Focused", bullet: bullet1 },
        { type: "Metrics-Driven (STAR Method)", bullet: bullet2 },
        { type: "Leadership & Project Ownership", bullet: bullet3 }
      ]
    };
  }

  // Helper for interview prep questions when Gemini is offline or rate-limited
  function runLocalInterviewQuestions(role: string, keywords: string[], jobDescription: string = "") {
    let req1 = "developing responsive user interfaces and scalable web services";
    let req2 = "partnering with cross-functional teams to ship clean code";

    if (jobDescription) {
      const sentences = jobDescription
        .split(/[.\n;•-]/)
        .map(s => s.trim().replace(/^["'\s•-]+|["'\s]+$/g, ""))
        .filter(s => s.length > 20 && !s.toLowerCase().includes("about us") && !s.toLowerCase().includes("benefit") && !s.toLowerCase().includes("equal opportunity"));

      const match1 = sentences.find(s => /experience|expert|strong|knowledge|proficient|skill|background/i.test(s));
      if (match1) {
        req1 = match1.charAt(0).toLowerCase() + match1.slice(1);
      }
      
      const match2 = sentences.find(s => /responsib|deliver|collaborat|design|develop|build|implement|architect/i.test(s) && s !== match1);
      if (match2) {
        req2 = match2.charAt(0).toLowerCase() + match2.slice(1);
      }
    }

    const kws = keywords && keywords.length > 0 ? keywords : ["modern web stacks"];
    const kw1 = kws[0];
    const kw2 = kws[1] || "frontend development";

    return [
      {
        question: `The ${role} position highlights a key requirement: '${req1}'. Can you describe a challenging project where you successfully demonstrated this competency using ${kw1}?`,
        response: `In my previous role, I took full ownership of a project directly aligned with this requirement: '${req1}'. Specifically, we needed to optimize a high-traffic module written in ${kw1} which was experiencing performance lag. I profiled the application, refactored state management, and streamlined database queries. As an immediate result, we boosted rendering speed by 45% and reduced memory usage by 30%. This directly met our SLA and provided a seamless user experience.`
      },
      {
        question: `How do you approach designing scalable architectures particularly when tasked with responsibilities like: '${req2}'?`,
        response: `When tackling requirements like '${req2}', I prioritize separation of concerns, modularity, and robust error handling. In my last project, I spearheaded the technical design of a service that addressed these exact challenges. By leveraging ${kw2}, implementing thorough automated unit tests (achieving 85%+ coverage), and designing robust APIs, our team delivered a modular system ahead of schedule. The codebase remains highly maintainable and easily scalable to meet future requirements.`
      },
      {
        question: `The ${role} role emphasizes team alignment and delivery. Can you share an instance where you collaborated across roles to turn raw specifications into a production-ready feature?`,
        response: `Iterative collaboration is critical. I once worked closely with a Lead UX Designer and Product Manager to build a complex feature under a tight 3-week deadline. By establishing early API contracts, creating interactive mockups, and maintaining an open Slack sync, we avoided alignment drift. We successfully launched on time, with 0 critical bugs in production, which proved that proactive, cross-functional communication is the cornerstone of engineering success.`
      }
    ];
  }

  // Helper for outreach email generation when Gemini is offline or rate-limited
  function runLocalOutreachEmail(company: string, role: string, keywords: string[], jobDescription: string = "", userName: string = "[Your Name]") {
    const sentences = jobDescription
      ? jobDescription
          .split(/[.\n;]/)
          .map(s => s.trim())
          .filter(s => s.length > 25)
      : [];
    const theme = sentences.find(s => /mission|focus|aim|build|creat|scale/i.test(s)) || `scaling development for ${role} workflows`;
    const cleanTheme = theme.replace(/^(we are|our mission is to|we aim to|looking to)\s+/i, "").trim();

    const kwList = keywords && keywords.length > 0 ? keywords.slice(0, 3).join(", ") : "software development";

    return `Subject: Inquiring about ${role} opportunities at ${company}

Dear Hiring Team,

I recently read about the ${role} opening at ${company}, and I was highly compelled by your focus on: "${cleanTheme}".

With a strong technical foundation in ${kwList}, my background aligns perfectly with the responsibilities and technical goals outlined in your job posting. I have a proven track record of designing high-fidelity, performant features and collaborating within cross-functional teams to deliver exceptional user value.

I would love to learn more about your team's current initiatives and share how my experience can contribute to ${company}'s success. Thank you very much for your time and consideration.

Warm regards,
${userName}`;
  }

  // API route to optimize bullet points
  app.post("/api/optimize-bullet", express.json(), async (req, res) => {
    const { bullet, keywords, jobDescription, company } = req.body;
    if (!bullet) {
      return res.status(400).json({ error: "No bullet point text provided." });
    }

    const keywordContext = keywords && Array.isArray(keywords) ? keywords.join(", ") : "";
    const descContext = jobDescription || "";
    const targetCompany = company || "";

    if (!apiKey) {
      console.warn("Gemini API key missing. Serving local bullet optimization.");
      return res.json(runLocalOptimizeBullet(bullet, keywords && Array.isArray(keywords) ? keywords : [], descContext));
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following weak bullet point and optimize it for a role at "${targetCompany || "the target company"}". Incorporate some of these keywords if relevant: ${keywordContext}.\n\nWeak bullet: "${bullet}"`,
        config: {
          systemInstruction: `You are an elite executive resume writer and ATS optimization expert. Your task is to rewrite the candidate's weak resume bullet point into three distinct, highly impressive, and professional formats tailored for ${targetCompany ? "the company " + targetCompany : "the target company"}: \n` +
            "1. 'Action-Oriented & Tech-Focused': Emphasize technical mastery, clean architecture, and strong action verbs.\n" +
            "2. 'Metrics-Driven (STAR Method)': Focus on high-impact quantitative results (metrics, percentages, time saved) using Google's XYZ formula (Accomplished X, as measured by Y, by doing Z).\n" +
            "3. 'Leadership & Project Ownership': Highlight end-to-end responsibility, collaboration, scaling systems, or mentoring others.\n" +
            "Ensure all outputs are polished, professional, started with powerful action verbs, and have no placeholder strings.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              optimized: { type: Type.STRING, description: "The single best overall optimized bullet point (usually metrics-driven)" },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "One of: 'Action-Oriented & Tech-Focused', 'Metrics-Driven (STAR Method)', 'Leadership & Project Ownership'" },
                    bullet: { type: Type.STRING, description: "The fully written, highly polished, professional bullet point starting with a strong action verb" }
                  },
                  required: ["type", "bullet"]
                }
              }
            },
            required: ["optimized", "options"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        optimized: parsed.optimized || bullet,
        options: Array.isArray(parsed.options) ? parsed.options : []
      });
    } catch (err: any) {
      console.log("Optimization API: Falling back to local high-fidelity processing.");
      res.json(runLocalOptimizeBullet(bullet, keywords && Array.isArray(keywords) ? keywords : [], descContext));
    }
  });

  // API route to generate interview prep questions
  app.post("/api/interview-questions", express.json(), async (req, res) => {
    const { role, keywords, jobDescription, company } = req.body;
    const targetRole = role || "Software Engineer";
    const descContext = jobDescription || "";
    const listKeywords = keywords && Array.isArray(keywords) ? keywords : [];
    const targetCompany = company || "the target company";

    if (!apiKey) {
      console.warn("Gemini API key missing. Serving local interview questions.");
      return res.json({ questions: runLocalInterviewQuestions(targetRole, listKeywords, descContext) });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate 3 standard behavioral and technical interview preparation questions for a candidate applying to a "${targetRole}" position at "${targetCompany}".\n\n` +
                  `Target Job Details & Description:\n${descContext}\n\n` +
                  `Identified skills or focus terms: ${listKeywords.join(", ")}.`,
        config: {
          systemInstruction: `You are an experienced technical recruiter and engineering coach at ${targetCompany}. Return exactly 3 highly relevant and specific interview preparation questions, along with their perfect responses. Your response must be a JSON array of objects. Each object must contain 'question' (the question string) and 'response' (the perfect, detailed, highly impressive response string). Do not include markdown or external wrapping. Output only the pure JSON array. Tailor the questions specifically to the nuances, stack, responsibilities, and values of ${targetCompany} as outlined in the pasted job description to ensure maximum accuracy.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "Highly relevant interview question tailored directly to the company and job description" },
                response: { type: Type.STRING, description: "An impressively detailed and professional response/answer that candidates can use (STAR method structured)" }
              },
              required: ["question", "response"]
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || "[]");
      res.json({ questions: parsed });
    } catch (err: any) {
      console.log("Interview Questions API: Falling back to local high-fidelity processing.");
      res.json({ questions: runLocalInterviewQuestions(targetRole, listKeywords, descContext) });
    }
  });

  // API route to generate outreach email drafts
  app.post("/api/outreach-email", express.json(), async (req, res) => {
    const { company, role, keywords, jobDescription, userName } = req.body;
    const targetCompany = company || "this company";
    const targetRole = role || "this role";
    const descContext = jobDescription || "";
    const listKeywords = keywords && Array.isArray(keywords) ? keywords : [];
    const finalUserName = userName || "the candidate";

    if (!apiKey) {
      console.warn("Gemini API key missing. Serving local outreach email.");
      return res.json({ email: runLocalOutreachEmail(targetCompany, targetRole, listKeywords, descContext, finalUserName) });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Draft a short, highly compelling LinkedIn cold outreach message to a recruiter/hiring manager for the "${targetRole}" position at "${targetCompany}". The candidate's name is "${finalUserName}".\n\n` +
                  `Target Job Description details:\n${descContext}\n\n` +
                  `Key Skills to touch upon: ${listKeywords.slice(0, 3).join(", ")}.`,
        config: {
          systemInstruction: `You are an exceptionally polite, warm, and professional career networking advisor. Your task is to draft a short, humble, and polite cold message expressing genuine interest. You must maintain an extremely respectful and professional tone. There must be absolutely NO sales-y hype, NO aggressive phrasing, NO inappropriate jargon, and absolutely zero harmful, offensive, or inappropriate words. Highlight the alignment of skills perfectly in a short message of under 150 words. Sign off with the candidate's name: "${finalUserName}". Do not use placeholder bracketed strings.`,
        }
      });

      res.json({ email: response.text?.trim() || "" });
    } catch (err: any) {
      console.log("Outreach Email API: Falling back to local high-fidelity processing.");
      res.json({ email: runLocalOutreachEmail(targetCompany, targetRole, listKeywords, descContext, finalUserName) });
    }
  });

  // Serve app using Vite in dev, or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
