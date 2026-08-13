"use server";
/*
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE: actions/aiQuestions.jsx
 * ROLE: Gemini AI se Interview Questions Generate Karna
 *
 * YEH FILE KYA KARTA HAI?
 *   1. Auth check karta hai (sirf logged-in users use kar saken)
 *   2. Category ke basis par Gemini ko specialized prompt bhejta hai
 *   3. Gemini ka JSON response parse karke questions + answers return karta hai
 *
 * USE CASE:
 *   Interviewer call ke dauran "Generate Questions" button dabata hai.
 *   Yeh action Gemini se 6 role-specific Q&A pairs generate karta hai
 *   jo interviewer live session me candidate se puch sakta hai.
 *
 * TRIGGER: Call room me interviewer ka AI Question sidebar button click hone par.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// GoogleGenerativeAI: Google's official Gemini AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

// currentUser: Clerk server utility — kaun request kar raha hai identify karne ke liye
import { currentUser } from "@clerk/nextjs/server";

// ── CATEGORY → TOPIC MAPPING ──────────────────────────────────────────────────
// Har interview category ke liye relevant topics define kiye hain.
// Yeh topics Gemini prompt me inject hote hain taaki focused questions aayein.
// Key = ENUM value (InterviewCategory from schema)
// Value = comma-separated topic list for Gemini context
const CATEGORY_PROMPTS = {
  FRONTEND:      "React, JavaScript, CSS, performance, accessibility, browser APIs",
  BACKEND:       "Node.js, REST APIs, databases, authentication, caching, scalability",
  FULLSTACK:     "full-stack architecture, API design, state management, deployment",
  DSA:           "data structures, algorithms, time complexity, problem solving",
  SYSTEM_DESIGN: "distributed systems, scalability, databases, microservices, caching",
  BEHAVIORAL:    "leadership, teamwork, conflict resolution, career growth, STAR method",
  DEVOPS:        "CI/CD, Docker, Kubernetes, cloud infrastructure, monitoring",
  MOBILE:        "React Native, iOS/Android, performance, offline support, app lifecycle",
};

// ── MAIN EXPORT: generateInterviewQuestions ───────────────────────────────────
// category: InterviewCategory enum value (e.g. "FRONTEND", "DSA")
// Returns: { questions: [{ question: "...", answer: "..." }, ...] }
export const generateInterviewQuestions = async ({ category }) => {
  // Step 1: Auth check — sirf logged-in users generate kar saken
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized"); // logged out = block

  // Step 2: Category validation
  // Category CATEGORY_PROMPTS keys me honi chahiye — invalid category reject karo
  if (!category || !CATEGORY_PROMPTS[category])
    throw new Error("Invalid category"); // prevent prompt injection via invalid categories

  // Step 3: Gemini AI client initialize karo
  // GEMINI_API_KEY: Google AI Studio se mila API key — server-only env variable
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // getGenerativeModel: specific Gemini model select karo
  // "gemini-2.5-flash-lite": fast + cost-efficient model for structured generation
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  // Step 4: Prompt engineering
  // Carefully crafted prompt jo:
  //   a) Role context deta hai (expert technical interviewer)
  //   b) Specific category + topics deta hai
  //   c) Format strictly define karta hai (JSON array only — no markdown, no extra text)
  //   d) Answer format bata ta hai (2-4 sentences — interviewer evaluation ke liye useful)
  const prompt = `You are an expert technical interviewer. Generate 6 interview questions for a ${category} role covering: ${CATEGORY_PROMPTS[category]}.

For each question, provide a concise but complete answer (2-4 sentences) that an interviewer can use to evaluate responses.

Respond ONLY with a valid JSON array. No markdown, no backticks, no explanation. Example format:
[{"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}]`;

  // Step 5: Gemini ko prompt bhejo
  const result = await model.generateContent(prompt);

  // Step 6: Response text nikalo aur clean karo
  const text = result.response.text().trim(); // raw text from Gemini

  // Model kabhi kabhi JSON ke around markdown fences laga deta hai (```json ... ```)
  // Regex se yeh fences remove karo taaki JSON.parse() fail na ho
  // Regex: /^```json|^```|```$/gm
  //   ^```json = starting ```json (multiline)
  //   ^```     = starting ``` without json
  //   ```$     = closing ``` at end of line
  const clean = text.replace(/^```json|^```|```$/gm, "").trim();

  // Step 7: JSON parse karo — string → JavaScript array of objects
  // Agar Gemini ne invalid JSON diya to yeh throw karega (error boundary upar handle karega)
  const questions = JSON.parse(clean);

  // Return: array of { question, answer } objects
  return { questions };
};
