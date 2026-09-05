export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  estimatedMin: number;
  dueDate?: string;
  scheduledAt?: string;
  tags: string[];
  sourceType?: 'MANUAL' | 'MOCK_INTERVIEW' | 'AI_PLANNER' | 'SKILL_GAP';
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  targetRole?: string;
  defaultWorkspaceId?: string;
}

export interface JobApplication {
  id: string;
  workspaceId: string;
  company: string;
  role: string;
  jobUrl?: string;
  jobDescriptionText?: string;
  status: 'WISHLIST' | 'APPLIED' | 'OA' | 'TECHNICAL' | 'HR' | 'OFFER' | 'REJECTED';
  matchScore: number;
  appliedDate?: string;
  interviewDate?: string;
  analysis?: {
    matchScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    experienceEvaluation: string;
    actionPlan: Array<{
      title: string;
      estimatedMin: number;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      reason: string;
    }>;
  };
}

export interface InterviewExchange {
  id: string;
  turnOrder: number;
  speaker: 'INTERVIEWER' | 'CANDIDATE';
  message: string;
  critique?: string;
  score?: number;
  isCallback?: boolean;
}

export interface InterviewSession {
  id: string;
  workspaceId: string;
  title: string;
  roleType: 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'SYSTEM_DESIGN' | 'HR';
  persona?: 'ALEX' | 'MAYA' | 'DANIEL';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  overallScore?: number;
  scores?: {
    technical: number;
    communication: number;
    problemSolving: number;
    relevance?: number;
    confidence: number;
  };
  feedbackSummary?: string;
  coachingAdvice?: string;
  strongAreas?: string[];
  weakAreas: string[];
  targetJobTitle?: string;
  exchanges: InterviewExchange[];
}

export interface DocumentItem {
  id: string;
  title: string;
  docType: 'RESUME' | 'JOB_DESCRIPTION' | 'NOTE' | 'INTERVIEW_EXP' | 'SYLLABUS';
  rawText: string;
  chunkCount: number;
  createdAt: string;
}

export interface DashboardStats {
  taskCount: number;
  completedCount: number;
  focusTime: string;
  progressPercent: number;
}
