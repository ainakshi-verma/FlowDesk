import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateJwt);

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedMin: z.number().int().positive().optional(),
  dueDate: z.string().optional(),
  scheduledAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sourceType: z.string().optional()
});

// Get tasks for workspace
router.get('/workspaces/:workspaceId/tasks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        userId: req.user!.id
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    const parsedTasks = tasks.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : []
    }));

    res.json(parsedTasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task in workspace
router.post('/workspaces/:workspaceId/tasks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const body = taskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        workspaceId,
        userId: req.user!.id,
        title: body.title,
        description: body.description,
        status: body.status || 'TODO',
        priority: body.priority || 'MEDIUM',
        estimatedMin: body.estimatedMin || 45,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        tags: body.tags ? JSON.stringify(body.tags) : '[]',
        sourceType: body.sourceType || 'MANUAL'
      }
    });

    res.status(201).json({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : []
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update task
router.patch('/tasks/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = taskSchema.partial().parse(req.body);

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.estimatedMin !== undefined) updateData.estimatedMin = body.estimatedMin;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.sourceType !== undefined) updateData.sourceType = body.sourceType;

    const task = await prisma.task.update({
      where: { id, userId: req.user!.id },
      data: updateData
    });

    res.json({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : []
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete task
router.delete('/tasks/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.task.delete({
      where: { id, userId: req.user!.id }
    });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
