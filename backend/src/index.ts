import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['ANTHROPIC_API_KEY'];
const optionalEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Warn about missing optional vars (Supabase)
const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);
if (missingOptional.length > 0) {
  console.warn(`⚠️  Missing Supabase config (auth disabled): ${missingOptional.join(', ')}`);
  console.warn('   Set these in .env to enable authentication');
}

// Import routes
import projectRoutes from './api/projects';
import workflowRoutes from './api/workflow';
import contentRoutes from './api/content';
import onboardingRoutes from './api/onboarding';
import interviewRoutes from './api/interview';
import debriefRoutes from './api/debrief';
import { authMiddleware } from './middleware/auth';

const app = express();

// Middleware - CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local port
  'https://pacy-frontend.onrender.com', // Production frontend
];

// Add custom frontend URL if provided
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies/auth headers
  })
);
app.use(express.json());
app.use(
  fileUpload({
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') },
    abortOnLimit: true,
  })
);

// Static files for uploads
const uploadDir = path.resolve(process.env.UPLOAD_DIR || '../uploads');
app.use('/uploads', express.static(uploadDir));

// Check if Supabase is configured
const supabaseConfigured = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY;

// API Routes - protected with auth if Supabase is configured
if (supabaseConfigured) {
  app.use('/api/projects', authMiddleware, projectRoutes);
  app.use('/api/workflow', authMiddleware, workflowRoutes);
  app.use('/api/content', authMiddleware, contentRoutes);
  app.use('/api/onboarding', authMiddleware, onboardingRoutes);
  app.use('/api/interview', authMiddleware, interviewRoutes);
  app.use('/api/debrief', authMiddleware, debriefRoutes);
} else {
  // Development mode without auth
  app.use('/api/projects', projectRoutes);
  app.use('/api/workflow', workflowRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/interview', interviewRoutes);
  app.use('/api/debrief', debriefRoutes);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Express Error Handler:', {
    message: err.message,
    stack: err.stack,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    name: err.name,
    code: err.code,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: {
        name: err.name,
        code: err.code,
        path: req.path,
        method: req.method,
      },
    }),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Pacy Training System API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
});

export default app;
