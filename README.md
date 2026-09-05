# FlowDesk — AI-Powered Personal Career & Productivity OS

> A high-performance, full-stack personal productivity workspace and career operating system designed to turn interview prep and engineering growth into an automated, feedback-driven loop.
>
> Built with **React 19, TypeScript, Tailwind CSS, Node.js, Express, Prisma ORM, PostgreSQL/SQLite, and Autonomous Multi-Agent AI (RAG + pgvector ready)**.

---

## 💡 The Core Philosophy: "AI Inside the Loop"

Most portfolio projects bolt on an AI chatbot in a floating sidebar. **FlowDesk embeds AI directly into the operational product loop**:

```
 ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
 │ Job Description │ ────> │  Career Agent   │ ────> │ Skill Gap Tasks │
 └─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                              │
                                                              ▼
 ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
 │ Workspace Board │ <──── │ Interview Agent │ <──── │  Tasks Kanban   │
 │ Remediation     │       │ (Mock Interview)│       │ (Active Sprint) │
 └─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                              │
                                                              ▼
 ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
 │   Dynamic RAG   │ <──── │  Planner Agent  │ <──── │  Study Calendar │
 │ Knowledge Search│       │ (Time Balancer) │       │ (Adaptive Loop) │
 └─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **AI Document Intelligence & Career Match**:
   - Parses target job descriptions against candidate resume.
   - Computes multi-factor match score % and extracts hard skill gaps.
   - **One-click**: Automatically populates missing skills as actionable tasks on the Kanban board.

2. **Autonomous AI Mock Interview Studio**:
   - Conducts multi-turn technical & behavioral interviews (Frontend, Backend, Fullstack, System Design, HR).
   - Generates dynamic follow-up questions probing superficial explanations.
   - Evaluates submissions against a 4-axis rubric (*Technical Knowledge*, *Communication*, *Problem Solving*, *Confidence*).
   - **Feedback Loop**: Pinpointed weak areas automatically spawn `#MockRemediation` tasks in the active workspace.

3. **Autonomous Planner Agent & Calendar Re-planning**:
   - Balances open tasks into the user's daily study budget (e.g. 2h/day).
   - Automatically recalibrates and reschedules when sessions are missed or overdue.

4. **Semantic Search & Grounded RAG**:
   - Automatically chunks and vector-embeds uploaded resumes, notes, and interview experiences.
   - Answers natural language queries strictly grounded in user notes with exact excerpt citations.

5. **Restrained Editorial UI/UX**:
   - Inspired by Linear, Raycast, and Notion.
   - Monochromatic zinc/slate design language, subtle borders, high information density, and keyboard shortcuts (`1-6`).
   - Zero AI cliches: no oversized purple neon orbs, no floating chatbots blocking content.

---

## 🛠️ Tech Stack

### Frontend (`apps/web`)
- **Framework**: React 18 / 19 with Vite & TypeScript
- **Styling**: Tailwind CSS (Dark theme with custom zinc/canvas palette)
- **Icons**: Lucide React
- **State Management**: Zustand
- **Architecture**: Modular feature views, responsive grid layouts, keyboard navigation

### Backend (`apps/api`)
- **Runtime**: Node.js 22 + TypeScript
- **API Framework**: Express.js with Zod schema validation
- **Database ORM**: Prisma ORM
- **Database Engine**:
  - Development: Zero-friction SQLite (`dev.db`)
  - Production / Cloud: PostgreSQL 16 with `pgvector` extension (`docker-compose.yml` included)
- **Authentication**: Stateless JWT with bcrypt password hashing
- **AI Core**:
  - Autonomous Agent Orchestrators (`CareerAgent`, `InterviewAgent`, `PlannerAgent`, `StudyAgent`)
  - Vector Cosine Similarity & Overlapping Window Text Chunker
  - Dual Provider Adapter: Direct OpenAI / Gemini API support with deterministic local fallback

---

## 📁 Repository Structure

```
ai project 01/
├── package.json                 # Monorepo configuration (npm workspaces)
├── docker-compose.yml           # PostgreSQL 16 + pgvector container
├── apps/
│   ├── api/                     # Backend API & AI Engines
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # SQLite Prisma Schema (instant dev run)
│   │   │   └── schema.postgres.prisma # PostgreSQL + pgvector Schema
│   │   └── src/
│   │       ├── ai/
│   │       │   ├── agents/      # Specialized AI agents (Career, Interview, Planner)
│   │       │   ├── llm.ts       # LLM Provider adapter
│   │       │   └── rag.ts       # Vector Search & Semantic RAG Engine
│   │       ├── routes/          # REST endpoints (auth, tasks, jobs, interviews, calendar)
│   │       ├── middleware/      # JWT auth, error handling
│   │       └── seed.ts          # High-fidelity realistic portfolio seed dataset
│   │
│   └── web/                     # Frontend Application
│       └── src/
│           ├── components/
│           │   ├── dashboard/   # Executive Overview & Focus Today
│           │   ├── tasks/       # Kanban Board (4 stages, priority badges, tags)
│           │   ├── jobs/        # Job Tracker & Career Resume Matcher
│           │   ├── interview/   # Dynamic Mock Interview Studio & Rubric Scorecard
│           │   ├── calendar/    # Adaptive Study Calendar & Planner Agent
│           │   ├── rag/         # Semantic Knowledge Base & Citations
│           │   └── layout/      # Sidebar (shortcuts 1-6) & Minimal Header
│           ├── store/           # Zustand State Store
│           └── services/        # Centralized typed API client
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (Tested on v22.20.0)
- **npm**: v10+ (Tested on 11.6.1)

### 2. Quickstart (Under 60 Seconds)

Clone the repository and install all dependencies:

```bash
# In the root directory
npm install --workspace=apps/api
npm install --workspace=apps/web
```

Initialize the database and populate demo portfolio data:

```bash
cd apps/api
npx prisma db push
npx ts-node-dev src/seed.ts
cd ../..
```

Start both the backend server and frontend client:

```bash
# Terminal 1: Backend API (runs on http://localhost:5000)
cd apps/api
npm run dev

# Terminal 2: Frontend Web UI (runs on http://localhost:3000)
cd apps/web
npm run dev
```

Open **`http://localhost:3000`** in your browser. The app will automatically connect and log in as demo engineer **Aina Sharma** with a complete, populated workspace.

---

## 🎯 Verification Test Suite

To run the automated end-to-end integration test across all 8 subsystems (Health, Auth, Dashboard, Tasks, Job Matcher, Mock Interview, RAG Semantic Search, and Planner Agent):

```bash
cd apps/api
node test-e2e.js
```

---

## 🏆 Resume & Capstone Bullet Points

- **Architected FlowDesk**: An AI-powered Career & Productivity OS synthesizing Notion workspaces, Trello Kanban boards, and adaptive calendar planning for tech placement preparation.
- **Implemented Multi-Agent System**: Designed 5 autonomous agents (Career, Mock Interview, Study, and Planner) using TypeScript and Zod structured outputs.
- **Engineered Product Feedback Loop**: Developed an AI Mock Interview studio that evaluates answers across a 4-axis rubric (Technical, Communication, Problem Solving, Confidence) and automatically spawns remediation tasks on the candidate's active board.
- **Built Document Intelligence & RAG**: Built a vector retrieval engine using sliding-window chunking and cosine similarity embeddings, providing grounded answers with exact citations over candidate notes and job listings.
- **Crafted Editorial UI**: Implemented a responsive, high-density React 19 interface with Tailwind CSS, Zustand, and keyboard shortcuts, consciously avoiding AI aesthetic clichés.
