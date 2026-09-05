import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';
import { interviewAgent } from '../ai/agents/interviewAgent';

const router = Router();
router.use(authenticateJwt);

const startInterviewSchema = z.object({
  title: z.string().optional(),
  roleType: z.enum(['FRONTEND', 'BACKEND', 'FULLSTACK', 'SYSTEM_DESIGN', 'HR']),
  customTopic: z.string().optional()
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
      scores: i.scores ? JSON.parse(i.scores) : null,
      weakAreas: i.weakAreas ? JSON.parse(i.weakAreas) : []
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Start new interview session
router.post('/workspaces/:workspaceId/interviews/start', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { roleType, title, customTopic } = startInterviewSchema.parse(req.body);

    const initialQuestion = await interviewAgent.getInitialQuestion(roleType, customTopic);

    const interview = await prisma.interviewSession.create({
      data: {
        workspaceId,
        userId: req.user!.id,
        title: title || `${roleType.charAt(0) + roleType.slice(1).toLowerCase()} Technical Mock`,
        roleType,
        status: 'IN_PROGRESS',
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
      scores: null,
      weakAreas: []
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Candidate submits answer turn
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

    // Evaluate candidate answer with Interview Agent
    const evaluation = await interviewAgent.evaluateTurn(
      interview.roleType,
      lastQuestion,
      answer,
      interview.exchanges.length
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

    // 2. Save Interviewer next question / follow up
    await prisma.interviewExchange.create({
      data: {
        interviewId: interview.id,
        turnOrder: currentOrder + 2,
        speaker: 'INTERVIEWER',
        message: evaluation.followUpOrNextQuestion
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
      exchanges: updatedExchanges
    });
  } catch (err: any) {
    console.error('Interview turn error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Finalize interview session & spawn remediation tasks
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

    const evaluation = await interviewAgent.finalizeInterview(interview.roleType, transcript);

    // Save final scores to InterviewSession
    const updatedSession = await prisma.interviewSession.update({
      where: { id: interview.id },
      data: {
        status: 'COMPLETED',
        overallScore: evaluation.overallScore,
        scores: JSON.stringify(evaluation.scores),
        feedbackSummary: evaluation.feedbackSummary,
        weakAreas: JSON.stringify(evaluation.weakAreas)
      },
      include: { exchanges: true }
    });

    // Automatically spawn remediation tasks on Workspace Kanban board!
    const generatedTasks = [];
    for (const task of evaluation.remediationTasks) {
      const created = await prisma.task.create({
        data: {
          workspaceId: interview.workspaceId,
          userId: req.user!.id,
          title: task.title,
          description: `Remediation from Mock Interview (${interview.roleType}): Identified weak point during evaluation.`,
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
        weakAreas: evaluation.weakAreas
      },
      generatedTasks,
      message: `Interview completed! Generated ${generatedTasks.length} remediation study tasks on your board.`
    });
  } catch (err: any) {
    console.error('Interview finalize error:', err);
    res.status(500).json({ error: 'Failed to finalize interview' });
  }
});

export default router;
