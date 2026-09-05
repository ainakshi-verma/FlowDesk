import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { ragEngine } from './ai/rag';

async function main() {
  console.log('🌱 Seeding FlowDesk Database with realistic portfolio data...');

  // 1. Clean existing records
  await prisma.interviewExchange.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'aina@flowdesk.dev',
      passwordHash,
      name: 'Aina Sharma',
      targetRole: 'Full Stack Software Engineer',
      skills: {
        create: [
          { name: 'TypeScript', category: 'LANGUAGE', level: 'ADVANCED', verified: true },
          { name: 'React', category: 'FRAMEWORK', level: 'ADVANCED', verified: true },
          { name: 'Node.js', category: 'FRAMEWORK', level: 'INTERMEDIATE', verified: true },
          { name: 'PostgreSQL', category: 'DATABASE', level: 'INTERMEDIATE', verified: false },
          { name: 'Data Structures & Algorithms', category: 'CONCEPT', level: 'ADVANCED', verified: true },
        ]
      }
    }
  });

  console.log(`👤 User created: ${user.name} (${user.email})`);

  // 3. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      userId: user.id,
      name: 'Placement Preparation 2026',
      description: 'Campus placements and Tier-1 product tech interviews preparation OS',
      color: '#0ea5e9'
    }
  });

  console.log(`📁 Workspace created: ${workspace.name}`);

  // 4. Create Initial Tasks
  const sampleTasks = [
    {
      title: 'Revise React Hooks & Custom Hook Design',
      description: 'Review useEffect cleanup, useMemo vs useCallback dependencies, and build a useDebounce hook.',
      status: 'TODO',
      priority: 'HIGH',
      estimatedMin: 45,
      tags: JSON.stringify(['React', 'Frontend']),
      sourceType: 'MANUAL',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2) // In 2 hours
    },
    {
      title: 'Solve 2 Medium DSA problems (Dynamic Programming & Binary Tree)',
      description: 'Coin Change II and Lowest Common Ancestor on LeetCode.',
      status: 'TODO',
      priority: 'HIGH',
      estimatedMin: 60,
      tags: JSON.stringify(['DSA', 'LeetCode']),
      sourceType: 'MANUAL',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 4)
    },
    {
      title: 'Apply to 3 Frontend / Fullstack Internships',
      description: 'Target Stripe, Razorpay, and Atlassian careers portals with customized resumes.',
      status: 'TODO',
      priority: 'MEDIUM',
      estimatedMin: 30,
      tags: JSON.stringify(['Applications', 'Career']),
      sourceType: 'MANUAL',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 6)
    },
    {
      title: 'Deep-Dive: React Virtual DOM Reconciliation & Fiber Architecture',
      description: 'Identified as a weak explanation during Mock Interview session. Review React 18 concurrent features and diffing.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      estimatedMin: 50,
      tags: JSON.stringify(['MockRemediation', 'React']),
      sourceType: 'MOCK_INTERVIEW'
    },
    {
      title: 'Study Docker containerization fundamentals & multi-stage builds',
      description: 'Identified from Stripe Job Description skill gap analysis.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedMin: 60,
      tags: JSON.stringify(['SkillGap', 'DevOps']),
      sourceType: 'SKILL_GAP'
    },
    {
      title: 'Build Distributed Rate Limiter in Node.js & Redis',
      description: 'System design portfolio piece demonstrating token bucket algorithm.',
      status: 'REVIEW',
      priority: 'MEDIUM',
      estimatedMin: 90,
      tags: JSON.stringify(['SystemDesign', 'Redis']),
      sourceType: 'MANUAL'
    },
    {
      title: 'Review REST API status codes (201, 204, 400, 401, 403, 409, 429)',
      description: 'Identified as a gap in technical mock interview.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      estimatedMin: 30,
      tags: JSON.stringify(['MockRemediation', 'Networking']),
      sourceType: 'MOCK_INTERVIEW'
    },
    {
      title: 'Master SQL Indexing & Join Algorithms (Hash vs Nested Loop)',
      description: 'Explored EXPLAIN ANALYZE and query optimization on Postgres tables.',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimatedMin: 60,
      tags: JSON.stringify(['Database', 'SQL']),
      sourceType: 'MANUAL'
    }
  ];

  for (const t of sampleTasks) {
    await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        ...t
      }
    });
  }
  console.log(`✅ Seeded ${sampleTasks.length} workspace tasks`);

  // 5. Create Job Applications
  const sampleJobs = [
    {
      company: 'Stripe',
      role: 'Full Stack Software Engineer',
      jobUrl: 'https://stripe.com/jobs/fullstack-eng',
      status: 'TECHNICAL',
      matchScore: 82,
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      interviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      jobDescriptionText: `
        Role: Full Stack Software Engineer at Stripe
        Requirements:
        - Strong proficiency with TypeScript, React, and Node.js.
        - Understanding of distributed systems, SQL, and database indexing.
        - Experience with Docker, Redis caching, and API rate limiting.
        - Solid foundation in data structures, algorithms, and secure API design.
      `,
      analysis: JSON.stringify({
        matchScore: 82,
        matchingSkills: ['TypeScript', 'React', 'Node.js', 'SQL', 'DSA'],
        missingSkills: ['Docker', 'Redis', 'Distributed Systems'],
        experienceEvaluation: 'High alignment on primary frontend and application layers. Target containerization and caching before Friday technical round.',
        actionPlan: [
          { title: 'Study Docker multi-stage builds', estimatedMin: 60, priority: 'HIGH', reason: 'Stripe core deployment standard' },
          { title: 'Revise Redis Cache-Aside pattern', estimatedMin: 45, priority: 'MEDIUM', reason: 'API performance requirement' }
        ]
      })
    },
    {
      company: 'Razorpay',
      role: 'Software Engineer - Platform',
      jobUrl: 'https://razorpay.com/careers/se-platform',
      status: 'OA',
      matchScore: 78,
      appliedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      jobDescriptionText: 'Build high-scale payments platform with Go/Node.js and PostgreSQL. High throughput microservices.',
      analysis: JSON.stringify({
        matchScore: 78,
        matchingSkills: ['Node.js', 'PostgreSQL', 'DSA', 'REST APIs'],
        missingSkills: ['Kafka', 'Microservices', 'Kubernetes'],
        experienceEvaluation: 'Solid backend and database foundations.',
        actionPlan: []
      })
    },
    {
      company: 'Google',
      role: 'Associate Software Engineer (Campus 2026)',
      jobUrl: 'https://careers.google.com',
      status: 'WISHLIST',
      matchScore: 88,
      jobDescriptionText: 'Problem solving in algorithms, graph traversal, dynamic programming, and systems design.',
      analysis: null
    }
  ];

  for (const j of sampleJobs) {
    await prisma.jobApplication.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        ...j
      }
    });
  }
  console.log(`✅ Seeded ${sampleJobs.length} job applications with Career Agent analysis`);

  // 6. Create Completed Mock Interview Session
  const interviewSession = await prisma.interviewSession.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      title: 'Frontend Core Technical Mock (React & Systems)',
      roleType: 'FRONTEND',
      status: 'COMPLETED',
      overallScore: 75,
      scores: JSON.stringify({
        technical: 78,
        communication: 71,
        problemSolving: 84,
        confidence: 68
      }),
      feedbackSummary: 'Demonstrated solid grasp of modern React features and state management. When probed on internals (Reconciliation diffing and microtask queue), candidate provided high-level summaries instead of specific algorithmic explanations.',
      weakAreas: JSON.stringify(['React reconciliation', 'REST API status codes', 'SQL joins'])
    }
  });

  const sampleExchanges = [
    {
      interviewId: interviewSession.id,
      turnOrder: 1,
      speaker: 'INTERVIEWER',
      message: "Welcome! Let's start with React core architecture. Can you explain how React's Virtual DOM and Reconciliation algorithm work under the hood?",
      critique: null,
      score: null
    },
    {
      interviewId: interviewSession.id,
      turnOrder: 2,
      speaker: 'CANDIDATE',
      message: "It's basically a lightweight copy of the real DOM kept in memory. When state updates, React generates a new Virtual DOM tree and compares it with the previous one, then updates only what changed in the real browser DOM.",
      critique: "Accurate basic premise, but does not explain the diffing heuristic or why direct DOM manipulation is costly.",
      score: 72
    },
    {
      interviewId: interviewSession.id,
      turnOrder: 3,
      speaker: 'INTERVIEWER',
      message: "You mentioned that it improves performance. Can you explain why reconciliation makes updates more efficient, and what heuristic rules the diffing algorithm uses to achieve O(n) complexity instead of O(n³)?",
      critique: null,
      score: null
    },
    {
      interviewId: interviewSession.id,
      turnOrder: 4,
      speaker: 'CANDIDATE',
      message: "Direct DOM manipulations trigger reflow and repaint which are expensive browser operations. For the O(n) diffing, React assumes two elements of different types will produce different trees, and uses key props to match children across renders.",
      critique: "Strong technical recovery! Correctly identified tree type comparison and the significance of key props in list diffing.",
      score: 86
    }
  ];

  for (const ex of sampleExchanges) {
    await prisma.interviewExchange.create({ data: ex });
  }
  console.log(`✅ Seeded realistic Mock Interview session with multi-turn evaluations`);

  // 7. Ingest Sample Documents & Chunk into RAG
  const resumeDoc = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      title: 'Aina_Sharma_Resume_2026.pdf',
      docType: 'RESUME',
      rawText: `
        Aina Sharma - Computer Science Engineering 2026.
        Summary: Full Stack Engineer with expertise in building performant web applications using React, TypeScript, Node.js, and PostgreSQL.
        Technical Skills:
        Languages: TypeScript, JavaScript, Python, Java, SQL, C++.
        Frameworks: React, Next.js, Express.js, Tailwind CSS, Prisma ORM.
        Tools & Databases: PostgreSQL, SQLite, Redis, Git, GitHub Actions, Docker.
        Projects:
        1. FlowDesk OS: AI-powered workspace combining Notion-style documents with autonomous agents for schedule planning and mock interviews.
        2. Scalable E-commerce API: Microservice architecture with JWT authentication, Stripe integration, and sub-50ms query response times.
        Achievements: Solved 450+ LeetCode problems (Knight badge); 1st place in National College Hackathon.
      `
    }
  });

  const interviewNotesDoc = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      title: 'Frontend Interview Experiences & Notes.md',
      docType: 'INTERVIEW_EXP',
      rawText: `
        Key Interview Questions from Top Product Companies:
        1. React Reconciliation: Explain Fiber reconciler, work loop, and concurrent rendering. Fiber allows splitting rendering work into chunks and prioritizing urgent updates (like user input) over background computations.
        2. JavaScript Event Loop: Microtasks (Promises, queueMicrotask) always run before macrotasks (setTimeout, setInterval).
        3. Web Performance: Critical Rendering Path, minimizing layout shifts (CLS), reducing bundle size via dynamic imports and code splitting.
        4. SQL Optimization: Use EXPLAIN ANALYZE. Indexes should be applied on foreign keys and high-cardinality search columns.
      `
    }
  });

  await ragEngine.ingestDocument(resumeDoc.id, resumeDoc.rawText);
  await ragEngine.ingestDocument(interviewNotesDoc.id, interviewNotesDoc.rawText);

  console.log('✅ Ingested and vector-embedded workspace documents into RAG engine');
  console.log('\n✨ Database seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
