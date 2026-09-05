import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';
import { interviewAgent, InterviewerPersona, PERSONA_CONFIGS } from '../ai/agents/interviewAgent';

const router = Router();
router.use(authenticateJwt);

const startInterviewSchema = z.object({
  title: z.string().optional(),
  roleType: z.enum(['FRONTEND', 'BACKEND', 'FULLSTACK', 'SYSTEM_DESIGN', 'HR']),
  persona: z.enum(['ALEX', 'MAYA', 'DANIEL']).optional().default('ALEX'),
  customTopic: z.string().optional(),
  jobId: z.string().optional()
});

const submitTurnSchema = z.object({
  answer: z.string().min(2)
});

// List interview sessions
router.get('/workspaces/:workspaceId/interviews', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const interviews = await prisma.interviewSession.findMany({
      where: { workspaceId, userId: req.user!.id },
      include: {
        exchanges: {
          orderBy: { turnOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsed = interviews.map(i => ({
      ...i,
      personaConfig: PERSONA_CONFIGS[i.persona as InterviewerPersona] || PERSONA_CONFIGS.ALEX,
      scores: i.scores ? JSON.parse(i.scores) : null,
      weakAreas: i.weakAreas ? JSON.parse(i.weakAreas) : [],
      strongAreas: i.strongAreas ? JSON.parse(i.strongAreas) : [],
      interviewMemory: i.interviewMemory ? JSON.parse(i.interviewMemory) : {}
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Start new interview session with Persona and Resume Context
router.post('/workspaces/:workspaceId/interviews/start', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { roleType, title, persona, customTopic, jobId } = startInterviewSchema.parse(req.body);

    // Fetch user's resume from workspace if available
    const resumeDoc = await prisma.document.findFirst({
      where: {
        workspaceId,
        userId: req.user!.id,
        docType: 'RESUME'
      },
      orderBy: { createdAt: 'desc' }
    });

    const resumeText = resumeDoc?.rawText || '';

    // Fetch target job if specified
    let targetJobTitle: string | null = null;
    if (jobId) {
      const job = await prisma.jobApplication.findUnique({ where: { id: jobId } });
      if (job) targetJobTitle = `${job.role} at ${job.company}`;
    }

    const personaKey = (persona || 'ALEX') as InterviewerPersona;
    const initialQuestion = await interviewAgent.getInitialQuestion(roleType, personaKey, resumeText, customTopic);

    const interview = await prisma.interviewSession.create({
      data: {
        workspaceId,
        userId: req.user!.id,
        title: title || `${PERSONA_CONFIGS[personaKey]?.name} — ${roleType.charAt(0) + roleType.slice(1).toLowerCase()} Interview`,
        roleType,
        persona: personaKey,
        targetJobTitle,
        status: 'IN_PROGRESS',
        interviewMemory: JSON.stringify({ claims: [], callbacksDone: [] }),
        exchanges: {
          create: {
            turnOrder: 1,
            speaker: 'INTERVIEWER',
            message: initialQuestion
          }
        }
      },
      include: {
        exchanges: true
      }
    });

    res.status(201).json({
      ...interview,
      personaConfig: PERSONA_CONFIGS[personaKey],
      scores: null,
      weakAreas: [],
      strongAreas: [],
      interviewMemory: { claims: [], callbacksDone: [] }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Candidate submits answer turn (Updates Memory, Handles Callbacks)
router.post('/interviews/:id/turn', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answer } = submitTurnSchema.parse(req.body);

    const interview = await prisma.interviewSession.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        exchanges: { orderBy: { turnOrder: 'asc' } }
      }
    });

    if (!interview || interview.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Active interview session not found' });
      return;
    }

    const lastQuestionExchange = [...interview.exchanges]
      .reverse()
      .find(e => e.speaker === 'INTERVIEWER');

    const lastQuestion = lastQuestionExchange?.message || 'Tell me about your technical approach.';

    const personaKey = (interview.persona || 'ALEX') as InterviewerPersona;
    const existingMemory = interview.interviewMemory ? JSON.parse(interview.interviewMemory) : {};

    // Evaluate candidate answer with Interview Agent
    const evaluation = await interviewAgent.evaluateTurn(
      interview.roleType,
      personaKey,
      lastQuestion,
      answer,
      interview.exchanges.length,
      existingMemory
    );

    const currentOrder = interview.exchanges.length;

    // 1. Save Candidate turn
    await prisma.interviewExchange.create({
      data: {
        interviewId: interview.id,
        turnOrder: currentOrder + 1,
        speaker: 'CANDIDATE',
        message: answer,
        critique: evaluation.critique,
        score: evaluation.score
      }
    });

    // 2. Save Interviewer follow up
    await prisma.interviewExchange.create({
      data: {
        interviewId: interview.id,
        turnOrder: currentOrder + 2,
        speaker: 'INTERVIEWER',
        message: evaluation.followUpOrNextQuestion,
        isCallback: evaluation.isCallback
      }
    });

    // 3. Update memory state
    const updatedMemory = {
      claims: Array.from(new Set([...(existingMemory.claims || []), ...(evaluation.extractedClaims || [])])),
      callbacksDone: evaluation.isCallback
        ? [...(existingMemory.callbacksDone || []), evaluation.followUpOrNextQuestion.slice(0, 30)]
        : existingMemory.callbacksDone || []
    };

    await prisma.interviewSession.update({
      where: { id: interview.id },
      data: {
        interviewMemory: JSON.stringify(updatedMemory)
      }
    });

    // Fetch updated exchanges
    const updatedExchanges = await prisma.interviewExchange.findMany({
      where: { interviewId: interview.id },
      orderBy: { turnOrder: 'asc' }
    });

    res.json({
      interviewId: interview.id,
      evaluation,
      interviewMemory: updatedMemory,
      exchanges: updatedExchanges
    });
  } catch (err: any) {
    console.error('Interview turn error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Finalize interview session & calculate 5-Axis Rubric
router.post('/interviews/:id/complete', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const interview = await prisma.interviewSession.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        exchanges: { orderBy: { turnOrder: 'asc' } }
      }
    });

    if (!interview) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }

    // Build transcript pairs for agent
    const transcript: Array<{ question: string; answer: string; score?: number }> = [];
    for (let i = 0; i < interview.exchanges.length; i += 2) {
      const q = interview.exchanges[i];
      const a = interview.exchanges[i + 1];
      if (q && a) {
        transcript.push({
          question: q.message,
          answer: a.message,
          score: a.score || undefined
        });
      }
    }

    const personaKey = (interview.persona || 'ALEX') as InterviewerPersona;
    const memory = interview.interviewMemory ? JSON.parse(interview.interviewMemory) : {};
    const memoryClaims: string[] = memory.claims || [];

    const evaluation = await interviewAgent.finalizeInterview(interview.roleType, personaKey, transcript, memoryClaims);

    // Save final scores to InterviewSession
    const updatedSession = await prisma.interviewSession.update({
      where: { id: interview.id },
      data: {
        status: 'COMPLETED',
        overallScore: evaluation.overallScore,
        scores: JSON.stringify(evaluation.scores),
        feedbackSummary: evaluation.feedbackSummary,
        coachingAdvice: evaluation.coachingAdvice,
        strongAreas: JSON.stringify(evaluation.strongAreas),
        weakAreas: JSON.stringify(evaluation.weakAreas)
      },
      include: { exchanges: true }
    });

    // Automatically spawn remediation tasks on Workspace Kanban board!
    const generatedTasks : any[] = [];
    for (const task of evaluation.remediationTasks) {
      const created = await prisma.task.create({
        data: {
          workspaceId: interview.workspaceId,
          userId: req.user!.id,
          title: task.title,
          description: `Identified by ${PERSONA_CONFIGS[personaKey]?.name} during Mock Interview: ${evaluation.feedbackSummary.slice(0, 100)}...`,
          priority: task.priority,
          estimatedMin: task.estimatedMin,
          status: 'TODO',
          sourceType: 'MOCK_INTERVIEW',
          tags: JSON.stringify(['MockRemediation', task.tag])
        }
      });
      generatedTasks.push({
        ...created,
        tags: JSON.parse(created.tags || '[]')
      });
    }

    res.json({
      session: {
        ...updatedSession,
        scores: evaluation.scores,
        strongAreas: evaluation.strongAreas,
        weakAreas: evaluation.weakAreas,
        coachingAdvice: evaluation.coachingAdvice
      },
      generatedTasks,
      message: `Interview completed! Evaluated across 5 axes and generated ${generatedTasks.length} study tasks on your board.`
    });
  } catch (err: any) {
    console.error('Interview finalize error:', err);
    res.status(500).json({ error: 'Failed to finalize interview' });
  }
});

// Practice Weak Areas: Spawns targeted drill session based on previous gaps
router.post('/interviews/:id/practice-weak-areas', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prevSession = await prisma.interviewSession.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!prevSession) {
      res.status(404).json({ error: 'Previous interview not found' });
      return;
    }

    const weakAreas = prevSession.weakAreas ? JSON.parse(prevSession.weakAreas) : ['Core Architecture'];
    const focusTopic = weakAreas[0] || 'Technical Remediation';

    const drillTitle = `Targeted Drill: ${focusTopic}`;
    const initialQuestion = `Welcome to this focused remediation drill. In our previous session, you showed opportunity for growth in "${focusTopic}". Let's dive specifically into that now. Explain the core mechanics and trade-offs of ${focusTopic}.`;

    const newDrillSession = await prisma.interviewSession.create({
      data: {
        workspaceId: prevSession.workspaceId,
        userId: req.user!.id,
        title: drillTitle,
        roleType: prevSession.roleType,
        persona: prevSession.persona,
        status: 'IN_PROGRESS',
        interviewMemory: JSON.stringify({ claims: [focusTopic], callbacksDone: [] }),
        exchanges: {
          create: {
            turnOrder: 1,
            speaker: 'INTERVIEWER',
            message: initialQuestion
          }
        }
      },
      include: { exchanges: true }
    });

    res.status(201).json({
      session: newDrillSession,
      focusTopic,
      message: `Launched targeted drill session on ${focusTopic}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to launch remediation drill' });
  }
});

export default router;
