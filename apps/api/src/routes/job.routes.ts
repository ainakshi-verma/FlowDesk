import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';
import { careerAgent } from '../ai/agents/careerAgent';

const router = Router();
router.use(authenticateJwt);

const jobSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  jobUrl: z.string().optional(),
  jobDescriptionText: z.string().optional(),
  status: z.enum(['WISHLIST', 'APPLIED', 'OA', 'TECHNICAL', 'HR', 'OFFER', 'REJECTED']).optional(),
  appliedDate: z.string().optional(),
  interviewDate: z.string().optional()
});

// List jobs
router.get('/workspaces/:workspaceId/jobs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const jobs = await prisma.jobApplication.findMany({
      where: { workspaceId, userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    const parsed = jobs.map(j => ({
      ...j,
      analysis: j.analysis ? JSON.parse(j.analysis) : null
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Create job
router.post('/workspaces/:workspaceId/jobs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const body = jobSchema.parse(req.body);

    const job = await prisma.jobApplication.create({
      data: {
        workspaceId,
        userId: req.user!.id,
        company: body.company,
        role: body.role,
        jobUrl: body.jobUrl,
        jobDescriptionText: body.jobDescriptionText,
        status: body.status || 'WISHLIST',
        appliedDate: body.appliedDate ? new Date(body.appliedDate) : null,
        interviewDate: body.interviewDate ? new Date(body.interviewDate) : null
      }
    });

    res.status(201).json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Run AI Career Match against user resume
router.post('/jobs/:id/match', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const job = await prisma.jobApplication.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!job) {
      res.status(404).json({ error: 'Job application not found' });
      return;
    }

    // Find user's resume in workspace
    const resumeDoc = await prisma.document.findFirst({
      where: {
        workspaceId: job.workspaceId,
        userId: req.user!.id,
        docType: 'RESUME'
      },
      orderBy: { createdAt: 'desc' }
    });

    const resumeContent = resumeDoc?.rawText || `
      Full Stack Developer Candidate.
      Skills: React, JavaScript, TypeScript, Node.js, Express, HTML5, CSS3, Tailwind CSS, PostgreSQL, Git, RESTful APIs, OOP, Data Structures and Algorithms.
      Experience: Built e-commerce dashboard and real-time chat application. Strong problem solving and algorithmic reasoning.
    `;

    const jdContent = job.jobDescriptionText || `
      ${job.role} at ${job.company}.
      Requirements: 0-2 years experience. Proficiency in React, TypeScript, Node.js, and SQL.
      Knowledge of Docker, Redis caching, microservices, and System Design is an added advantage.
    `;

    // Run Career Agent
    const matchResult = await careerAgent.evaluateMatch(resumeContent, jdContent);

    // Save back to job application
    const updatedJob = await prisma.jobApplication.update({
      where: { id: job.id },
      data: {
        matchScore: matchResult.matchScore,
        analysis: JSON.stringify(matchResult)
      }
    });

    res.json({
      ...updatedJob,
      analysis: matchResult
    });
  } catch (err: any) {
    console.error('Job match error:', err);
    res.status(500).json({ error: 'Failed to run career match evaluation' });
  }
});

// One-click generate remediation tasks from missing skills
router.post('/jobs/:id/generate-tasks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const job = await prisma.jobApplication.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!job || !job.analysis) {
      res.status(400).json({ error: 'No career analysis found on this job. Run match first.' });
      return;
    }

    const analysis = JSON.parse(job.analysis);
    const actionPlan: Array<{ title: string; estimatedMin: number; priority: string; reason: string }> = analysis.actionPlan || [];

    const createdTasks = [];
    for (const plan of actionPlan) {
      const task = await prisma.task.create({
        data: {
          workspaceId: job.workspaceId,
          userId: req.user!.id,
          title: plan.title,
          description: `Generated from ${job.company} (${job.role}) requirement: ${plan.reason}`,
          priority: plan.priority || 'HIGH',
          estimatedMin: plan.estimatedMin || 60,
          status: 'TODO',
          sourceType: 'SKILL_GAP',
          tags: JSON.stringify(['SkillGap', job.company])
        }
      });
      createdTasks.push({
        ...task,
        tags: JSON.parse(task.tags || '[]')
      });
    }

    res.json({
      success: true,
      message: `Successfully created ${createdTasks.length} study tasks`,
      tasks: createdTasks
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate study tasks' });
  }
});

export default router;
