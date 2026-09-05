import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';
import { plannerAgent } from '../ai/agents/plannerAgent';

const router = Router();
router.use(authenticateJwt);

const replanSchema = z.object({
  dailyStudyMinutes: z.number().int().min(30).max(480).optional().default(120)
});

// Autonomous Calendar Re-planning
router.post('/workspaces/:workspaceId/calendar/replan', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { dailyStudyMinutes } = replanSchema.parse(req.body);

    const openTasks = await prisma.task.findMany({
      where: {
        workspaceId,
        userId: req.user!.id,
        status: { in: ['TODO', 'IN_PROGRESS'] }
      }
    });

    if (openTasks.length === 0) {
      res.json({
        schedule: [],
        aiInsight: 'All tasks in this workspace are completed! Add new goals or start a mock interview.',
        totalHoursPlanned: 0
      });
      return;
    }

    const plan = await plannerAgent.replanSchedule(openTasks, dailyStudyMinutes);

    // Persist scheduled dates to tasks
    for (const item of plan.schedule) {
      await prisma.task.update({
        where: { id: item.taskId },
        data: {
          scheduledAt: new Date(`${item.date}T18:00:00.000Z`)
        }
      });
    }

    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get scheduled items for calendar view
router.get('/workspaces/:workspaceId/calendar/events', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        userId: req.user!.id,
        scheduledAt: { not: null }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    const events = tasks.map(t => ({
      id: t.id,
      title: t.title,
      date: t.scheduledAt?.toISOString().split('T')[0],
      priority: t.priority,
      status: t.status,
      estimatedMin: t.estimatedMin,
      tags: t.tags ? JSON.parse(t.tags) : []
    }));

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

export default router;
