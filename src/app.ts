import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import teacherRoutes from './routes/teacher.routes';
import sessionRoutes from './routes/session.routes';
import { errorHandler } from './middlewares/error.middleware';
import { ApiError } from './utils/apiError';

const app: Application = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    message: 'Session Booking Platform API is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/users', userRoutes);
app.use('/teachers', teacherRoutes);
app.use('/sessions', sessionRoutes);

// Catch 404 for undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
