import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import projectRoutes from './api/projects';
import workflowRoutes from './api/workflow';
import contentRoutes from './api/content';

const app = express();
const { app: wsApp } = expressWs(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') },
  abortOnLimit: true,
}));

// Static files for uploads
const uploadDir = path.resolve(process.env.UPLOAD_DIR || '../uploads');
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/content', contentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Pacy Training System API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
});

export default app;
