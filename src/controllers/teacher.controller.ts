import { Request, Response } from 'express';
import { teacherService } from '../services/teacher.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class TeacherController {
  /**
   * Create Teacher
   * POST /teachers
   */
  public createTeacher = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, specialization, experience } = req.body;

    if (!fullName || !email || !specialization || experience === undefined) {
      throw new ApiError(
        400,
        'fullName, email, specialization, and experience are required fields'
      );
    }

    const teacher = await teacherService.createTeacher({
      fullName,
      email,
      specialization,
      experience: Number(experience),
    });

    return res
      .status(201)
      .json(new ApiResponse(201, teacher, 'Teacher created successfully'));
  });

  /**
   * Get all Teachers
   * GET /teachers
   */
  public getAllTeachers = asyncHandler(async (req: Request, res: Response) => {
    const teachers = await teacherService.getAllTeachers();

    return res
      .status(200)
      .json(new ApiResponse(200, teachers, 'Teachers retrieved successfully'));
  });
}

export const teacherController = new TeacherController();
