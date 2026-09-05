import { llm } from '../llm';

export interface TurnEvaluation {
  critique: string;
  score: number; // 0-100
  followUpOrNextQuestion: string;
  isFollowUp: boolean;
}

export interface FinalInterviewEvaluation {
  overallScore: number;
  scores: {
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
  };
  feedbackSummary: string;
  weakAreas: string[];
  remediationTasks: Array<{
    title: string;
    estimatedMin: number;
    priority: 'HIGH' | 'MEDIUM';
    tag: string;
  }>;
}

export class InterviewAgent {
  async getInitialQuestion(roleType: string, customTopic?: string): Promise<string> {
    const roleQuestions: Record<string, string[]> = {
      FRONTEND: [
        "Explain how React's Virtual DOM and Reconciliation algorithm work under the hood. Specifically, how does the Diffing algorithm optimize render cycles?",
        "How does the browser's Event Loop handle microtasks vs macrotasks when handling Promise resolutions and setTimeout callbacks?",
        "Walk me through how you would architect state management and caching in a large-scale enterprise React web app."
      ],
      BACKEND: [
        "Explain how database indexes (such as B-Trees) work internally and what happens to read/write latency when you over-index a table.",
        "How would you design an idempotent payment processing API to ensure users aren't charged twice during network timeouts?",
        "Compare Redis caching strategies: Cache-Aside vs Write-Through vs Write-Back. What are the trade-offs in consistency?"
      ],
      FULLSTACK: [
        "Describe what happens from the moment a user enters a URL in their browser to the point where an interactive webpage is rendered, spanning DNS, TCP/TLS, HTTP, and DOM parsing.",
        "How do you implement secure user authentication and authorization using JWT with refresh token rotation and CSRF protection?"
      ],
      SYSTEM_DESIGN: [
        "Design a scalable URL shortening service (like Bitly) handling 100 million requests daily. Cover database choice, hashing collisions, and caching.",
        "Design a distributed rate limiter for a multi-region microservices architecture."
      ],
      HR: [
        "Tell me about a challenging technical roadblock or system outage you encountered. How did you diagnose the root cause, communicate with stakeholders, and resolve it?"
      ]
    };

    const list = roleQuestions[roleType.toUpperCase()] || roleQuestions['FULLSTACK'];
    return list[Math.floor(Math.random() * list.length)];
  }

  async evaluateTurn(
    roleType: string,
    question: string,
    candidateAnswer: string,
    turnCount: number
  ): Promise<TurnEvaluation> {
    const prompt = `
Role: ${roleType}
Interviewer Question: "${question}"
Candidate Answer: "${candidateAnswer}"

Analyze this answer. Provide:
1. Constructive critique (max 2 sentences, pinpointing technical accuracy or omissions).
2. Score (0-100).
3. If the answer was vague or incomplete, formulate a sharp, direct technical follow-up. Otherwise, introduce the next relevant technical question.

Output strict JSON:
{
  "critique": "You correctly identified...",
  "score": 75,
  "followUpOrNextQuestion": "Can you explain specifically how...",
  "isFollowUp": true
}
`;

    const res = await llm.complete(prompt, "You are a Principal Software Engineer conducting a high-bar technical interview. Return raw JSON.");
    if (res) {
      try {
        const cleaned = res.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {}
    }

    // Fallback logic if LLM is offline
    const length = candidateAnswer.trim().split(/\s+/).length;
    let score = 70;
    let isFollowUp = false;
    let critique = "Good conceptual direction, but could benefit from deeper architectural justification.";
    let nextQ = "";

    if (length < 20) {
      score = 55;
      isFollowUp = true;
      critique = "The explanation is brief and misses crucial underlying mechanics.";
      nextQ = `You mentioned the high-level concept, but how does this behave under edge cases or high concurrency?`;
    } else if (candidateAnswer.toLowerCase().includes("reconciliation") || candidateAnswer.toLowerCase().includes("index") || candidateAnswer.toLowerCase().includes("latency")) {
      score = 85;
      critique = "Strong explanation referencing core technical terms and practical trade-offs.";
      nextQ = `Excellent. Now shifting to system reliability: how would you monitor and trace performance bottlenecks in this implementation?`;
    } else {
      score = 75;
      critique = "Solid answer covering the primary points. Expanding on trade-offs would elevate the response.";
      nextQ = `Let's dive into practical implementation: what design patterns would you apply to keep this code testable and decoupled?`;
    }

    return { critique, score, followUpOrNextQuestion: nextQ, isFollowUp };
  }

  async finalizeInterview(
    roleType: string,
    history: Array<{ question: string; answer: string; score?: number }>
  ): Promise<FinalInterviewEvaluation> {
    const prompt = `
Review this mock interview transcript for a ${roleType} role:
${JSON.stringify(history, null, 2)}

Provide a strict JSON evaluation:
{
  "overallScore": 78,
  "scores": {
    "technical": 80,
    "communication": 75,
    "problemSolving": 82,
    "confidence": 72
  },
  "feedbackSummary": "Candidate showed strong foundational knowledge...",
  "weakAreas": ["React Reconciliation", "SQL Indexing", "REST Status Codes"],
  "remediationTasks": [
    {
      "title": "Study React Reconciliation & Fiber Architecture",
      "estimatedMin": 45,
      "priority": "HIGH",
      "tag": "React"
    },
    {
      "title": "Practice B-Tree Index analysis in PostgreSQL",
      "estimatedMin": 60,
      "priority": "HIGH",
      "tag": "Database"
    }
  ]
}
`;

    const res = await llm.complete(prompt, "You are an Elite Technical Hiring Committee Chair. Return raw JSON.");
    if (res) {
      try {
        const cleaned = res.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {}
    }

    // High quality deterministic fallback
    const avgScore = history.length > 0
      ? Math.round(history.reduce((acc, h) => acc + (h.score || 72), 0) / history.length)
      : 76;

    const weakAreas = roleType === 'FRONTEND'
      ? ['React Virtual DOM Diffing', 'Event Loop Microtasks', 'State Immutability Patterns']
      : roleType === 'BACKEND'
      ? ['Database B-Tree Indexing', 'API Idempotency Keys', 'Cache Invalidation']
      : ['System Scalability Bottlenecks', 'Asynchronous Queue Processing', 'REST API Error Semantics'];

    return {
      overallScore: avgScore,
      scores: {
        technical: Math.min(95, avgScore + 2),
        communication: Math.max(60, avgScore - 4),
        problemSolving: Math.min(92, avgScore + 5),
        confidence: Math.max(65, avgScore - 2),
      },
      feedbackSummary: `Candidate demonstrated solid core competency for ${roleType} roles with clear articulation on main concepts. Continued refinement on deep internal mechanics and trade-off comparisons will elevate the profile to senior tier.`,
      weakAreas,
      remediationTasks: weakAreas.map(area => ({
        title: `Deep-Dive Revision: ${area}`,
        estimatedMin: 50,
        priority: 'HIGH' as const,
        tag: 'MockRemediation'
      }))
    };
  }
}

export const interviewAgent = new InterviewAgent();
