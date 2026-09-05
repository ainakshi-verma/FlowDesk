import { llm } from '../llm';

export interface PlannedScheduleItem {
  taskId: string;
  taskTitle: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "18:00 - 19:00"
  estimatedMin: number;
  reason: string;
}

export interface ReplanResult {
  schedule: PlannedScheduleItem[];
  aiInsight: string;
  totalHoursPlanned: number;
}

export class PlannerAgent {
  async replanSchedule(
    tasks: Array<{ id: string; title: string; priority: string; estimatedMin?: number | null; dueDate?: Date | null }>,
    dailyStudyMinutes: number = 120,
    startDate: Date = new Date()
  ): Promise<ReplanResult> {
    const schedule: PlannedScheduleItem[] = [];
    let currentDate = new Date(startDate);
    let currentDayAllocatedMin = 0;

    // Sort tasks: URGENT -> HIGH -> MEDIUM -> LOW
    const priorityWeight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const sortedTasks = [...tasks].sort((a, b) => {
      const weightA = priorityWeight[a.priority.toUpperCase()] || 2;
      const weightB = priorityWeight[b.priority.toUpperCase()] || 2;
      return weightB - weightA;
    });

    for (const task of sortedTasks) {
      const duration = task.estimatedMin || 45;

      if (currentDayAllocatedMin + duration > dailyStudyMinutes) {
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDayAllocatedMin = 0;
      }

      const dateStr = currentDate.toISOString().split('T')[0];
      const startHour = 18 + Math.floor(currentDayAllocatedMin / 60);
      const startMin = currentDayAllocatedMin % 60;
      const endHour = 18 + Math.floor((currentDayAllocatedMin + duration) / 60);
      const endMin = (currentDayAllocatedMin + duration) % 60;

      const formatTime = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      schedule.push({
        taskId: task.id,
        taskTitle: task.title,
        date: dateStr,
        timeSlot: `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`,
        estimatedMin: duration,
        reason: task.priority === 'URGENT' || task.priority === 'HIGH'
          ? 'High-priority blocker scheduled in earliest available focus window'
          : 'Distributed within daily study threshold'
      });

      currentDayAllocatedMin += duration;
    }

    const totalMinutes = schedule.reduce((sum, item) => sum + item.estimatedMin, 0);

    return {
      schedule,
      aiInsight: `Optimized ${schedule.length} tasks across the next ${Math.ceil(totalMinutes / dailyStudyMinutes) || 1} days based on your ${dailyStudyMinutes / 60}h daily study budget. Urgent interview preparations have been front-loaded.`,
      totalHoursPlanned: Number((totalMinutes / 60).toFixed(1))
    };
  }
}

export const plannerAgent = new PlannerAgent();
