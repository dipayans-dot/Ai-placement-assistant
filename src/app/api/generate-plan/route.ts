import { NextRequest, NextResponse } from "next/server";

interface QuestionItem {
  category: string;
  difficulty: "Medium" | "Hard" | "Staff Level" | "Situational" | string;
  question: string;
  whyItIsAsked: string;
  keyPoints: string[];
}

interface GeneratePlanResponse {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  questions: QuestionItem[];
  engine?: "gemini-live" | "intelligent-failover";
}

// Fallback generator when external Gemini endpoints experience 503 high-demand surges
function generateIntelligentFallback(
  jobDescription: string,
  resume: string,
  targetLevel?: string,
  focusArea?: string
): GeneratePlanResponse {
  const seniority = targetLevel || "Mid to Senior";
  const focus = focusArea || "Full Loop";
  console.log(`[API /api/generate-plan] 🛡️ Activating Intelligent Local Synthesis Engine (${seniority} / ${focus})...`);

  const techDictionary = [
    "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Express", "Python", "Django", "FastAPI",
    "Java", "Spring Boot", "Go", "Golang", "C++", "C#", ".NET", "Rust", "PostgreSQL", "MySQL", "MongoDB",
    "Redis", "Kafka", "RabbitMQ", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "GraphQL", "REST",
    "CI/CD", "Microservices", "Elasticsearch", "Distributed Transactions", "Tailwind CSS", "Jest", "Playwright",
    "SQL", "NoSQL", "Saga Pattern", "Event-Driven", "WebSockets"
  ];

  const jdLower = jobDescription.toLowerCase();
  const resumeLower = resume.toLowerCase();

  const jdTech = techDictionary.filter(t => jdLower.includes(t.toLowerCase()));
  const resumeTech = techDictionary.filter(t => resumeLower.includes(t.toLowerCase()));

  const matchedTech = jdTech.filter(t => resumeTech.includes(t));
  const missingTech = jdTech.filter(t => !resumeTech.includes(t));

  const totalReqs = Math.max(jdTech.length, 4);
  const matchRatio = matchedTech.length / totalReqs;
  const matchScore = Math.min(95, Math.max(58, Math.round(matchRatio * 45 + 50)));

  const strengths = matchedTech.length > 0
    ? matchedTech.slice(0, 3).map(t => `Demonstrated hands-on experience in ${t} aligned with JD requirements`)
    : [
        "Strong core software engineering and problem-solving foundation",
        "Demonstrated technical execution across application lifecycle",
        "Adaptable stack expertise matching target role complexity"
      ];

  const gaps = missingTech.length > 0
    ? missingTech.slice(0, 3).map(t => `${t} emphasized in JD but omitted or unproven in candidate profile`)
    : [
        "Distributed system scaling under 10x traffic bursts",
        "Deep concurrency & memory profiling under peak load",
        "Cross-functional architectural trade-off leadership"
      ];

  const primaryGap = missingTech[0] || (jdTech[0] || "Distributed Systems");
  const primaryStrength = matchedTech[0] || (resumeTech[0] || "Core Architecture");

  const questions: QuestionItem[] = [
    {
      category: `Core Architecture & Scalability: ${primaryGap}`,
      difficulty: "Hard",
      question: `The job description heavily emphasizes ${primaryGap}, which is absent or lightly covered in your resume. If you were tasked with building a mission-critical service using ${primaryGap}, how would you architect it to guarantee fault tolerance, strict consistency, and sub-100ms response times under unexpected load spikes?`,
      whyItIsAsked: `FAANG Bar Raiser probe to verify how rapidly you ramp up on missing stack requirements and whether you grasp fundamental distributed systems primitives rather than just memorized syntax.`,
      keyPoints: [
        `Clarify system constraints (throughput, latency, consistency vs availability trade-offs).`,
        `Describe partitioning, replication, backpressure, and failover mechanisms specific to ${primaryGap}.`,
        `Detail observability metrics (p95/p99 latency, queue depth, error budgets) and mitigation strategies.`
      ]
    },
    {
      category: `Resume Claim Audit: ${primaryStrength}`,
      difficulty: "Medium",
      question: `You highlighted substantial hands-on experience with ${primaryStrength} on your resume. Walk me through the most technically complex architectural decision or performance bottleneck you resolved using ${primaryStrength}. What alternatives did you discard, and how did you benchmark the outcome?`,
      whyItIsAsked: `Distinguishes authentic engineering ownership from superficial buzzword claims on resumes. Evaluates deep technical judgment and profiling discipline.`,
      keyPoints: [
        `State the exact engineering problem, throughput baseline, and latency bottlenecks.`,
        `Discuss alternatives evaluated and explain why the chosen architecture was optimal.`,
        `Detail how you verified the improvement using profiling tools, telemetry, and regression tests.`
      ]
    },
    {
      category: "High-Stakes Behavioral & Incident Response (STAR)",
      difficulty: "Staff Level",
      question: `Describe a real scenario where a critical defect, race condition, or severe latency degradation occurred in production right after a release. How did you triage under pressure, communicate with stakeholders, and implement long-term safeguards?`,
      whyItIsAsked: `Evaluates emotional composure under fire, blameless post-mortem discipline, and high-standard engineering leadership expected at top tech companies.`,
      keyPoints: [
        `Structure using the STAR method: Situation, Task, Action, Result.`,
        `Emphasize immediate mitigation (killswitches, traffic rerouting, or automated rollback) prior to debugging.`,
        `Describe root-cause isolation and automated regression monitors implemented to permanently prevent recurrence.`
      ]
    }
  ];

  return {
    matchScore,
    strengths,
    gaps,
    questions,
    engine: "intelligent-failover"
  };
}

export async function POST(req: NextRequest) {
  const reqStart = Date.now();
  console.log(`\n======================================================`);
  console.log(`[API /api/generate-plan] 📥 Request received at ${new Date().toISOString()}`);

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const body = await req.json().catch((err) => {
      console.error("[API /api/generate-plan] ❌ Failed to parse JSON request body:", err);
      return null;
    });

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { jobDescription, resume, targetLevel, focusArea } = body;

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      return NextResponse.json(
        { error: "Resume content is required" },
        { status: 400 }
      );
    }

    console.log(`[API /api/generate-plan] 📋 Request verified: JD (${jobDescription.length} chars), Resume (${resume.length} chars)`);

    // If API key is missing, fall back immediately to intelligent synthesis
    if (!apiKey) {
      console.warn("[API /api/generate-plan] ⚠️ GEMINI_API_KEY missing. Using Intelligent Local Engine.");
      const fallback = generateIntelligentFallback(jobDescription, resume, targetLevel, focusArea);
      return NextResponse.json(fallback);
    }

    const systemPrompt = `You are an elite, demanding Staff / Principal Technical Interviewer and Hiring Bar Raiser at a top-tier tech company (FAANG / Big Tech).
Your role is to rigorously evaluate candidates by analyzing the precise alignment and gaps between their Resume and the target Job Description.

Do NOT ask generic textbook definitions or cliché trivia questions (e.g. "what is a closure" or "what is polymorphism").
Generate exactly 3 customized, high-signal mock interview questions tailored directly to the intersection of this candidate's resume and the job description:
1. Technical Architecture / Distributed Systems / Coding Depth: Scrutinize core technologies from the JD that are mission-critical, pushing for trade-offs, concurrency, scaling limits, caching, and failure modes.
2. Resume Claim Scrutiny: Interrogate a specific project, metric, tool, or achievement claimed on their resume. Test whether they actually designed and built it or are exaggerating. Probe benchmarks, profiling decisions, edge cases, and architectural alternatives.
3. High-Stakes Behavioral / Incident Response (STAR Method): A domain-specific crisis or cross-functional leadership challenge reflecting the target job (e.g. data loss, critical outage, trade-off between speed vs technical debt).

You must respond ONLY with a valid JSON object strictly matching this TypeScript structure:
{
  "matchScore": number (an integer between 40 and 98 based on realistic JD vs Resume overlap),
  "strengths": string[] (array of 3 specific candidate strengths matching the JD),
  "gaps": string[] (array of 3 specific missing technologies or risk areas from the JD that the candidate will be grilled on),
  "questions": [
    {
      "category": string (e.g. "Core Architecture & Concurrency", "Resume Audit: Latency Optimization", "Behavioral & Incident Leadership"),
      "difficulty": "Medium" | "Hard" | "Staff Level" | "Situational",
      "question": string (the verbatim, rigorous question the interviewer asks),
      "whyItIsAsked": string (the interviewer's hidden motive and what signal determines a 'Hire' vs 'No Hire'),
      "keyPoints": string[] (array of 3-4 specific talking points, metrics, or patterns a strong candidate must hit)
    }
  ]
}`;

    const userPrompt = `Candidate Target Seniority: ${targetLevel || "Mid to Senior"}
Target Prep Focus: ${focusArea || "Full Loop"}

=== TARGET JOB DESCRIPTION ===
${jobDescription.trim()}

=== CANDIDATE RESUME ===
${resume.trim()}

Analyze both carefully. Generate the 3 customized mock questions following the specified JSON schema.`;

    // Fast candidate models with low latency priority
    const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash"];

    const payload = {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    };

    let rawText: string | undefined;
    let selectedModel: string | undefined;

    // Fast probe with max 7s timeout per model to never hang the client
    for (const model of candidateModels) {
      const modelStart = Date.now();
      console.log(`[API /api/generate-plan] 🚀 Attempting Model: ${model} (7s timeout)...`);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(7000),
        });

        const elapsed = Date.now() - modelStart;
        console.log(`[API /api/generate-plan] ⏱️ Model ${model} responded in ${elapsed}ms with HTTP ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            rawText = candidateText;
            selectedModel = model;
            console.log(`[API /api/generate-plan] ✅ Model ${model} succeeded! Received ${candidateText.length} chars.`);
            break;
          }
        } else {
          const errText = await response.text();
          console.warn(`[API /api/generate-plan] ⚠️ Model ${model} error ${response.status}: ${errText.slice(0, 100)}`);
        }
      } catch (fetchErr: unknown) {
        const elapsed = Date.now() - modelStart;
        const msg = fetchErr instanceof Error ? fetchErr.message : "Fetch failed";
        console.warn(`[API /api/generate-plan] ⚠️ Model ${model} bypassed after ${elapsed}ms: ${msg}`);
      }
    }

    if (rawText) {
      try {
        const cleanedText = rawText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();

        const parsedResult: GeneratePlanResponse = JSON.parse(cleanedText);
        parsedResult.engine = "gemini-live";
        console.log(`[API /api/generate-plan] 🎯 Successfully parsed live Gemini response from ${selectedModel}!`);
        console.log(`[API /api/generate-plan] 📤 Returning 200 OK (Total: ${Date.now() - reqStart}ms)`);
        console.log(`======================================================\n`);
        return NextResponse.json(parsedResult);
      } catch (parseErr) {
        console.error("[API /api/generate-plan] ❌ Failed to parse Gemini JSON:", parseErr);
      }
    }

    // Seamless failover: If external Gemini is under 503 high demand or timed out,
    // generate tailored high-signal questions from the candidate input immediately
    console.log(`[API /api/generate-plan] ⚡ Gemini API returned 503/timeout across models. Triggering seamless intelligent failover...`);
    const fallbackResult = generateIntelligentFallback(jobDescription, resume, targetLevel, focusArea);
    console.log(`[API /api/generate-plan] 📤 Returning 200 OK via Intelligent Failover (Total: ${Date.now() - reqStart}ms)`);
    console.log(`======================================================\n`);
    return NextResponse.json(fallbackResult);
  } catch (error: unknown) {
    console.error(`[API /api/generate-plan] 💥 Unhandled fatal error:`, error);
    // Even on fatal error, return clean fallback so client never breaks
    const body = await req.json().catch(() => null);
    const fallbackResult = generateIntelligentFallback(
      body?.jobDescription || "Software Engineering Role",
      body?.resume || "Software Development Candidate",
      body?.targetLevel,
      body?.focusArea
    );
    return NextResponse.json(fallbackResult);
  }
}
