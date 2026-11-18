import { Router } from 'express';
import { teacherController } from '../controllers/teacher.controller';

const router = Router();

// Create Teacher
router.post('/', teacherController.createTeacher);

// Get all Teachers
router.get('/', teacherController.getAllTeachers);

export default router;
