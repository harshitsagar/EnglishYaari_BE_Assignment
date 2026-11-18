import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';

const router = Router();

// API 2 - Create Session
router.post('/', sessionController.createSession);

// API 3 - Available Sessions for Booking (Using Aggregation Pipeline)
router.get('/available', sessionController.getAvailableSessions);

// API 4 - Book Session
router.post('/:id/book', sessionController.bookSession);

// API 5 - Mark Session Complete
router.patch('/:id/complete', sessionController.completeSession);

export default router;
