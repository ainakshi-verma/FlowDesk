import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import taskRoutes from './routes/task.routes';
import jobRoutes from './routes/job.routes';
import interviewRoutes from './routes/interview.routes';
import documentRoutes from './routes/document.routes';
import calendarRoutes from './routes/calendar.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'FlowDesk API', timestamp: new Date().toISOString() });
});

// Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', taskRoutes);
app.use('/api', jobRoutes);
app.use('/api', interviewRoutes);
app.use('/api', documentRoutes);
app.use('/api', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 FlowDesk API server running on http://localhost:${PORT}`);
  console.log(`📁 Environment: ${config.nodeEnv}`);
});

export default app;
