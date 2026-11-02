"use client";

import React, { useState } from "react";

interface QuestionItem {
  category: string;
  difficulty: "Medium" | "Hard" | "Staff Level" | "Situational" | string;
  question: string;
  whyItIsAsked: string;
  keyPoints: string[];
}

interface PrepPlanData {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  questions: QuestionItem[];
  engine?: "gemini-live" | "intelligent-failover";
}

// Mock template data for fast 1-click preview
const SAMPLE_JD = `Role: Senior Full Stack Engineer (Fintech)
Location: Remote / Hybrid
Experience: 3-5 Years

Requirements:
- Strong proficiency in TypeScript, React, Next.js (App Router), and Node.js.
- Experience architecting microservices, PostgreSQL, and Redis caching.
- Familiarity with event-driven architectures (Kafka / RabbitMQ), REST & GraphQL APIs.
- Deep understanding of secure authentication (JWT, OAuth2) and ACID transactions.
- Passion for low-latency financial ledger systems and automated CI/CD pipelines.`;

const SAMPLE_RESUME = `Alex Rivera — Senior Software Engineer
Summary: 4+ years building high-throughput web applications with TypeScript, React, and Node.js.

Key Experience:
- Software Engineer @ PayFlow: Built real-time payment gateway servicing 120k daily transactions. Reduced API latency by 35% with Redis caching and query indexing.
- Full Stack Developer @ CloudPulse: Developed responsive Next.js dashboards, integrated microservices using Node.js & Docker, and authored end-to-end Jest/Playwright tests.
- Tech Stack: TypeScript, JavaScript, React, Next.js, Node.js, Express, PostgreSQL, MongoDB, Redis, Docker, AWS (S3, ECS), Git, CI/CD.
- Education: B.S. in Computer Science (2021).`;

const DEFAULT_SAMPLE_PLAN: PrepPlanData = {
  matchScore: 88,
  strengths: [
    "TypeScript & Next.js production stack experience",
    "Microservice caching with Redis & PostgreSQL indexing",
    "Quantifiable impact on latency reduction at scale"
  ],
  gaps: [
    "Event-driven message brokers (Kafka/RabbitMQ) not detailed",
    "Distributed ACID transaction & Saga orchestration depth",
    "Financial ledger reliability & zero-loss compliance"
  ],
  questions: [
    {
      category: "Technical Architecture & Concurrency",
      difficulty: "Hard",
      question: "How would you prevent race conditions and guarantee idempotency when processing high-volume financial transactions across distributed microservices?",
      whyItIsAsked: "Tests knowledge of distributed systems, database transaction isolation (SERIALIZABLE / SELECT FOR UPDATE), and Redis distributed locks for financial reliability.",
      keyPoints: [
        "Explain Idempotency Keys stored with unique constraints in PostgreSQL or Redis with TTL.",
        "Discuss database transactions, optimistic vs. pessimistic locking, and Saga pattern for distributed consistency.",
        "Describe Dead Letter Queues (DLQ) and exponential backoff retry policies for downstream failures."
      ]
    },
    {
      category: "Resume Deep Dive & Past Impact",
      difficulty: "Medium",
      question: "At PayFlow, you cut latency by 35% using Redis and indexing. Walk me through your profiling process and how you determined which database queries to optimize.",
      whyItIsAsked: "Verifies authentic hands-on experience on resume claims versus superficial tool usage.",
      keyPoints: [
        "Mention query execution plans (`EXPLAIN ANALYZE` in PostgreSQL) identifying sequential table scans.",
        "Explain composite index design and cache invalidation strategies (Cache-Aside pattern).",
        "Discuss observability and telemetry (e.g. OpenTelemetry, Datadog) used before/after benchmarking."
      ]
    },
    {
      category: "Production Incident & STAR Behavioral",
      difficulty: "Situational",
      question: "Tell me about a time a critical production payment bug or data inconsistency occurred right before a release. How did you triage, communicate, and resolve it under pressure?",
      whyItIsAsked: "Evaluates emotional quotient (EQ), calm cross-functional stakeholder communication, and disciplined incident post-mortem analysis.",
      keyPoints: [
        "Structure using the STAR framework: Situation, Task, Action, Result.",
        "Emphasize rapid mitigation first (rollback/killswitch) followed by root-cause investigation.",
        "Highlight the blameless post-mortem and automated regression tests added to prevent recurrence."
      ]
    }
  ]
};

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [targetLevel, setTargetLevel] = useState("Mid to Senior");
  const [focusArea, setFocusArea] = useState("Full Loop (Tech + Design + Behavioral)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState("Connecting to Gemini API...");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [planData, setPlanData] = useState<PrepPlanData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleFillSample = () => {
    setJobDescription(SAMPLE_JD);
    setResume(SAMPLE_RESUME);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setJobDescription("");
    setResume("");
    setHasGenerated(false);
    setPlanData(null);
    setErrorMessage(null);
  };

  const handlePreviewSample = () => {
    handleFillSample();
    setPlanData(DEFAULT_SAMPLE_PLAN);
    setHasGenerated(true);
    setErrorMessage(null);
    setTimeout(() => {
      const resultElem = document.getElementById("prep-results");
      if (resultElem) {
        resultElem.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || !resume.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setLoadingStage("Connecting to Gemini API...");

    console.log("[PrepAI Frontend] 🚀 Generate clicked. Preparing payload:", {
      jdLength: jobDescription.length,
      resumeLength: resume.length,
      targetLevel,
      focusArea,
      timestamp: new Date().toISOString(),
    });

    // Cycle stage text every few seconds so the user sees continuous progress
    const stages = [
      "Connecting to Gemini API...",
      "Analyzing Job Description requirements...",
      "Scrutinizing candidate resume experience...",
      "FAANG Bar Raiser formulating 3 customized questions...",
      "Structuring interviewer intent & winning talking points...",
      "Finalizing response...",
    ];
    let stageIdx = 0;
    const intervalId = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setLoadingStage(stages[stageIdx]);
      console.log(`[PrepAI Frontend] ⏳ Step: ${stages[stageIdx]}`);
    }, 3500);

    const clientStart = Date.now();

    try {
      console.log("[PrepAI Frontend] 📡 Sending POST /api/generate-plan (timeout: 55s)...");

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resume,
          targetLevel,
          focusArea,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const elapsed = Date.now() - clientStart;
      console.log(`[PrepAI Frontend] 📥 Response received in ${elapsed}ms. HTTP Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("[PrepAI Frontend] ❌ API returned error payload:", errorData);
        throw new Error(errorData?.error || `Request failed with status ${response.status}`);
      }

      const result: PrepPlanData = await response.json();
      console.log("[PrepAI Frontend] ✅ Successfully received prep plan:", result);

      setPlanData(result);
      setHasGenerated(true);

      setTimeout(() => {
        const resultElem = document.getElementById("prep-results");
        if (resultElem) {
          resultElem.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } catch (err: unknown) {
      const elapsed = Date.now() - clientStart;
      const message = err instanceof Error ? err.message : "Failed to generate interview plan";
      console.error(`[PrepAI Frontend] 💥 Error after ${elapsed}ms:`, message);
      setErrorMessage(message);
    } finally {
      clearInterval(intervalId);
      setIsGenerating(false);
      console.log("[PrepAI Frontend] 🏁 isGenerating set to false.");
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const currentPlan = planData || DEFAULT_SAMPLE_PLAN;
  const questionsList = currentPlan.questions || [];

  const filteredQuestions = activeTab === "all"
    ? questionsList
    : questionsList.filter((_, idx) => {
        if (activeTab === "tech") return idx === 0;
        if (activeTab === "resume") return idx === 1;
        if (activeTab === "behavioral") return idx === 2;
        return true;
      });

  const getDifficultyBadge = (difficulty: string) => {
    const diff = difficulty?.toLowerCase() || "";
    if (diff.includes("hard") || diff.includes("staff")) {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }
    if (diff.includes("medium")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    if (diff.includes("situational")) {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Glow Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PrepAI
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                FAANG Bar Raiser
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Gemini 2.5 Flash Connected
            </span>
            <button
              onClick={handleFillSample}
              type="button"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-sm cursor-pointer"
            >
              Load Sample Data
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-12">
        {/* ===================== HERO SECTION ===================== */}
        <section className="text-center space-y-5 max-w-4xl mx-auto pt-2 sm:pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            AI-Powered Strict Placement Bar Raiser
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stress-Test Your Profile with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              FAANG-Caliber Questions
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Our interviewer model scrutinizes the exact delta between your Resume and the Job Description to probe
            technical architecture trade-offs, interrogate project claims, and test crisis response.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-xl sm:text-2xl font-bold text-white">3 High-Signal</div>
              <div className="text-xs text-slate-400 mt-0.5">Customized Questions</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-xl sm:text-2xl font-bold text-indigo-400">FAANG</div>
              <div className="text-xs text-slate-400 mt-0.5">Bar Raiser Persona</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-xl sm:text-2xl font-bold text-violet-400">Real-Time</div>
              <div className="text-xs text-slate-400 mt-0.5">Gemini 2.5 Flash API</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-xl sm:text-2xl font-bold text-cyan-400">STAR</div>
              <div className="text-xs text-slate-400 mt-0.5">Structured Talking Points</div>
            </div>
          </div>
        </section>

        {/* ===================== FORM SECTION ===================== */}
        <section className="bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Context Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Input Placement Data
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gemini analyzes both inputs side-by-side to construct personalized interview questions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Level:</span>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option>Fresher / Intern</option>
                    <option>Junior (1-2 yrs)</option>
                    <option>Mid to Senior</option>
                    <option>Staff / Principal</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Focus:</span>
                  <select
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option>Full Loop (Tech + Design + Behavioral)</option>
                    <option>Coding & Algorithmic Depth</option>
                    <option>Distributed Systems Architecture</option>
                    <option>Culture Fit & Crisis Management</option>
                  </select>
                </div>

                {(jobDescription || resume) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-slate-400 hover:text-rose-400 transition ml-2 underline underline-offset-4 cursor-pointer"
                  >
                    Clear inputs
                  </button>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-sm flex items-start justify-between gap-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-semibold text-white">Generation Failed: </span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-white text-xs font-mono"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Two Large Textareas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Textarea 1: Job Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="jd-input" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Paste Job Description (JD)
                    <span className="text-rose-400 text-xs">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {jobDescription.length} chars
                  </span>
                </div>

                <div className="relative group">
                  <textarea
                    id="jd-input"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job role, responsibilities, required technical skills, qualifications, and domain details here..."
                    rows={12}
                    required
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition font-sans resize-y leading-relaxed"
                  />
                  {!jobDescription && (
                    <button
                      type="button"
                      onClick={() => setJobDescription(SAMPLE_JD)}
                      className="absolute bottom-4 right-4 text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md transition backdrop-blur-sm cursor-pointer"
                    >
                      Paste sample JD
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea 2: Resume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="resume-input" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                    Paste Resume / Candidate Profile
                    <span className="text-rose-400 text-xs">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {resume.length} chars
                  </span>
                </div>

                <div className="relative group">
                  <textarea
                    id="resume-input"
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    placeholder="Paste your resume content: experience history, technical projects, programming languages, libraries, and educational background..."
                    rows={12}
                    required
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition font-sans resize-y leading-relaxed"
                  />
                  {!resume && (
                    <button
                      type="button"
                      onClick={() => setResume(SAMPLE_RESUME)}
                      className="absolute bottom-4 right-4 text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md transition backdrop-blur-sm cursor-pointer"
                    >
                      Paste sample resume
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Prominent Submit Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Generates 3 customized questions directly via the Gemini API.</span>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !jobDescription.trim() || !resume.trim()}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-white shadow-xl transition-all duration-200 transform active:scale-95 ${
                  isGenerating || !jobDescription.trim() || !resume.trim()
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    : "bg-gradient-to-r from-indigo-500 via-violet-600 to-indigo-600 hover:from-indigo-400 hover:via-violet-500 hover:to-indigo-500 shadow-indigo-500/25 ring-1 ring-white/20 hover:shadow-indigo-500/40 cursor-pointer"
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="font-medium tracking-wide animate-pulse">{loadingStage}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="text-base tracking-wide">Generate Prep Plan</span>
                    <svg className="w-4 h-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ===================== AI QUESTIONS / PREP PLAN PLACEHOLDER SECTION ===================== */}
        <section id="prep-results" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasGenerated ? "bg-emerald-400" : "bg-indigo-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${hasGenerated ? "bg-emerald-500" : "bg-indigo-500"}`}></span>
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center flex-wrap gap-2">
                  <span>{hasGenerated ? "FAANG Mock Interview Questions" : "AI Interview Output Placeholder"}</span>
                  {hasGenerated && (
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                      currentPlan.engine === "intelligent-failover"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                    }`}>
                      {currentPlan.engine === "intelligent-failover" ? "⚡ High-Demand Instant Mode" : "✨ Gemini 3.x Live"}
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {hasGenerated
                  ? "Live synthesized by Gemini: Customized strictly based on the discrepancy between JD and candidate profile."
                  : "Submit your Job Description and Resume above to trigger live Gemini evaluation."}
              </p>
            </div>

            {hasGenerated && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const fullText = questionsList
                      .map((q, i) => `Question ${i + 1} [${q.category} - ${q.difficulty}]:\nQ: ${q.question}\n\nInterviewer Intent: ${q.whyItIsAsked}\n\nKey Talking Points:\n- ${q.keyPoints.join("\n- ")}`)
                      .join("\n\n---\n\n");
                    navigator.clipboard.writeText(fullText);
                    setCopiedIndex(999);
                    setTimeout(() => setCopiedIndex(null), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copiedIndex === 999 ? "All Questions Copied!" : "Copy Full Question Bank"}
                </button>
              </div>
            )}
          </div>

          {!hasGenerated ? (
            /* Sleek Empty / Placeholder State */
            <div className="rounded-2xl border-2 border-dashed border-slate-800/80 bg-slate-900/30 p-8 sm:p-12 text-center relative overflow-hidden backdrop-blur-sm">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-white">
                    FAANG Bar Raiser is Ready
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Paste your target JD and Resume above and click &quot;Generate Prep Plan&quot;. Gemini will formulate 3 tailored questions to grill you on architecture, claimed projects, and behavioral scenarios.
                  </p>
                </div>

                {/* Preview Cards / Skeleton Mockup */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-indigo-400">01</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-300">Technical Depth</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Scrutinizes mission-critical JD tech requirements.</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-violet-400">02</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-300">Resume Claim Audit</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Tests depth on claimed metrics and architecture choices.</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-cyan-400">03</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-300">Crisis & STAR</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">High-stakes incident response and cross-functional leadership.</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePreviewSample}
                    className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    <span>Click here to preview a generated plan immediately</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Populated Prep Plan / Questions View */
            <div className="space-y-6 animate-fadeIn">
              {/* ATS & Match Analysis Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Candidate Match Score</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {currentPlan.matchScore >= 80 ? "Strong Match" : currentPlan.matchScore >= 65 ? "Moderate Match" : "Stretch Opportunity"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">{currentPlan.matchScore}%</span>
                    <span className="text-xs text-slate-400">Readiness against JD requirements</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, currentPlan.matchScore))}%` }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                  <div className="text-xs font-medium text-slate-400">Identified Strengths</div>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                    {(currentPlan.strengths || []).map((strength, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 text-emerald-400">
                        <span className="shrink-0">✓</span>
                        <span className="text-slate-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                  <div className="text-xs font-medium text-slate-400">Interviewer Probing Areas (Gaps)</div>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                    {(currentPlan.gaps || []).map((gap, gIdx) => (
                      <li key={gIdx} className="flex items-start gap-2 text-amber-400">
                        <span className="shrink-0 font-bold">!</span>
                        <span className="text-slate-300">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  All Questions ({questionsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tech")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === "tech"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  1. Technical & Concurrency
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("resume")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === "resume"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  2. Resume Claim Audit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("behavioral")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === "behavioral"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  3. Incident & STAR
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredQuestions.map((item, index) => {
                  const actualIndex = activeTab === "all" ? index : (activeTab === "tech" ? 0 : activeTab === "resume" ? 1 : 2);
                  return (
                    <div
                      key={index}
                      className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition space-y-4 shadow-lg shadow-black/20"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            Question {actualIndex + 1}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            {item.category}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getDifficultyBadge(item.difficulty)}`}>
                            {item.difficulty}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(`Q: ${item.question}\n\nInterviewer Intent: ${item.whyItIsAsked}\n\nKey Talking Points:\n- ${item.keyPoints.join("\n- ")}`, index)}
                          className="self-start sm:self-auto text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          {copiedIndex === index ? "Copied" : "Copy"}
                        </button>
                      </div>

                      <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
                        {item.question}
                      </h3>

                      {/* Why this is asked */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                        <span className="font-semibold text-indigo-400">FAANG Bar Raiser Intent: </span>
                        <span className="text-slate-300">{item.whyItIsAsked}</span>
                      </div>

                      {/* Key Talking Points */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Winning Talking Points & Solution Angles:
                        </span>
                        <ul className="space-y-1.5">
                          {(item.keyPoints || []).map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p>© 2026 PrepAI Placement Assistant. Built with Next.js, React, Tailwind CSS, and Gemini API.</p>
          <p className="text-[11px] text-slate-600">Empowering candidates with real-time role matching and interview intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
