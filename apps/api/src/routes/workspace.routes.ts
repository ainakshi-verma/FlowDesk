import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateJwt);

const workspaceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  color: z.string().optional()
});

// List workspaces
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(workspaces);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// Create workspace
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = workspaceSchema.parse(req.body);
    const workspace = await prisma.workspace.create({
      data: {
        userId: req.user!.id,
        name: data.name,
        description: data.description,
        color: data.color || '#0ea5e9'
      }
    });
    res.status(201).json(workspace);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Workspace Summary & Analytics
router.get('/:id/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workspace = await prisma.workspace.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        tasks: true,
        applications: true,
        interviews: true,
        documents: true
      }
    });

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const totalTasks = workspace.tasks.length;
    const completedTasks = workspace.tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = workspace.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = workspace.tasks.filter(t => t.status === 'TODO').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalFocusMinutes = workspace.tasks
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.estimatedMin || 45), 0);

    const completedInterviews = workspace.interviews.filter(i => i.status === 'COMPLETED');
    const avgInterviewScore = completedInterviews.length > 0
      ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completedInterviews.length)
      : null;

    res.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        color: workspace.color
      },
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        progressPercent,
        totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
        applicationsCount: workspace.applications.length,
        documentsCount: workspace.documents.length,
        interviewsCount: workspace.interviews.length,
        avgInterviewScore
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute workspace summary' });
  }
});

export default router;
