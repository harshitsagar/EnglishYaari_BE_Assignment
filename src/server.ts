import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  process.exit(1);
});

// Connect to MongoDB & Start Server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Listening on http://localhost:${PORT}`);
    console.log(`==================================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error('[CRITICAL] Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
};

startServer();
