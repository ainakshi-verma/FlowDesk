import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksKanbanView } from './components/tasks/TasksKanbanView';
import { JobsMatchView } from './components/jobs/JobsMatchView';
import { MockInterviewView } from './components/interview/MockInterviewView';
import { DynamicCalendarView } from './components/calendar/DynamicCalendarView';
import { KnowledgeRagView } from './components/rag/KnowledgeRagView';
import { useStore } from './store/useStore';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, initSession, isLoading } = useStore();

  useEffect(() => {
    initSession();

    // Keyboard shortcuts (1-6)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1') setActiveTab('dashboard');
      if (e.key === '2') setActiveTab('tasks');
      if (e.key === '3') setActiveTab('jobs');
      if (e.key === '4') setActiveTab('interview');
      if (e.key === '5') setActiveTab('calendar');
      if (e.key === '6') setActiveTab('rag');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'tasks':
        return <TasksKanbanView />;
      case 'jobs':
        return <JobsMatchView />;
      case 'interview':
        return <MockInterviewView />;
      case 'calendar':
        return <DynamicCalendarView />;
      case 'rag':
        return <KnowledgeRagView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0c0d0f] text-zinc-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <main className="flex-1 pb-16">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default App;
