import { Types } from 'mongoose';
import { Teacher, ITeacher } from '../models/teacher.model';
import { ApiError } from '../utils/apiError';

export class TeacherService {
  /**
   * Create a new teacher
   */
  public async createTeacher(teacherData: {
    fullName: string;
    email: string;
    specialization: string;
    experience: number;
  }): Promise<ITeacher> {
    const teacher = await Teacher.create({
      fullName: teacherData.fullName,
      email: teacherData.email.toLowerCase(),
      specialization: teacherData.specialization,
      experience: teacherData.experience,
    });

    return teacher;
  }

  /**
   * Get all teachers
   */
  public async getAllTeachers(): Promise<ITeacher[]> {
    return Teacher.find().sort({ createdAt: -1 });
  }

  /**
   * Get teacher by ID helper
   */
  public async getTeacherById(teacherId: string): Promise<ITeacher> {
    if (!Types.ObjectId.isValid(teacherId)) {
      throw new ApiError(400, 'Invalid Teacher ID format');
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new ApiError(404, 'Teacher not found');
    }

    return teacher;
  }
}

export const teacherService = new TeacherService();
