import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateJwt);

router.get('/overview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get active/default workspace
    const workspace = await prisma.workspace.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: true,
        applications: true,
        interviews: true
      }
    });

    if (!workspace) {
      res.status(404).json({ error: 'No workspace found' });
      return;
    }

    const tasks = workspace.tasks;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const todayTasks = tasks.filter(t => t.status !== 'COMPLETED').slice(0, 3);

    const totalMin = completedTasks.reduce((sum, t) => sum + (t.estimatedMin || 45), 0);
    const focusHours = Math.floor(totalMin / 60);
    const focusMins = totalMin % 60;

    const progressPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    // Dynamic intelligent insight based on workspace state
    const highPriorityCount = tasks.filter(t => (t.priority === 'HIGH' || t.priority === 'URGENT') && t.status !== 'COMPLETED').length;
    const missingSkillsTasks = tasks.filter(t => t.sourceType === 'SKILL_GAP' && t.status !== 'COMPLETED');
    const mockTasks = tasks.filter(t => t.sourceType === 'MOCK_INTERVIEW' && t.status !== 'COMPLETED');

    let aiInsight = "You're keeping a balanced distribution between foundational data structures and full-stack development.";
    let suggestedAction = "Keep maintaining the current pace.";

    if (mockTasks.length > 0) {
      aiInsight = `Your last mock interview identified ${mockTasks.length} technical gap(s). Prioritize "${mockTasks[0].title}" before moving to new job applications.`;
      suggestedAction = "Study Interview Weak Areas";
    } else if (missingSkillsTasks.length > 0) {
      aiInsight = `Target job applications require skills not yet marked completed. We recommend dedicating your next focus block to "${missingSkillsTasks[0].title}".`;
      suggestedAction = "Close Skill Gaps";
    } else if (highPriorityCount > 0) {
      aiInsight = `You have ${highPriorityCount} high-priority deadlines approaching. FlowDesk has front-loaded these into your evening focus window.`;
      suggestedAction = "Focus on High Priority";
    }

    res.json({
      userName: req.user!.name,
      workspaceName: workspace.name,
      workspaceId: workspace.id,
      stats: {
        taskCount: tasks.filter(t => t.status !== 'COMPLETED').length,
        completedCount: completedTasks.length,
        focusTime: `${focusHours}h ${focusMins}m`,
        progressPercent: progressPct
      },
      todayTasks: todayTasks.map(t => ({
        id: t.id,
        title: t.title,
        estimatedMin: t.estimatedMin || 45,
        priority: t.priority,
        status: t.status,
        tags: t.tags ? JSON.parse(t.tags) : []
      })),
      aiInsight: {
        analysis: aiInsight,
        suggestedAction
      }
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

export default router;
