import { Types } from 'mongoose';
import { Session, ISession, SessionStatus } from '../models/session.model';
import { Teacher } from '../models/teacher.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/apiError';

export class SessionService {
  /**
   * API 2: Create a new session for a teacher
   * Rules: Validate teacher exists, validate endTime > startTime, default status AVAILABLE.
   */
  public async createSession(sessionData: {
    teacherId: string;
    startTime: string | number | Date;
    endTime: string | number | Date;
  }): Promise<ISession> {
    const { teacherId, startTime, endTime } = sessionData;

    // 1. Validate Teacher ID format
    if (!Types.ObjectId.isValid(teacherId)) {
      throw new ApiError(400, 'Invalid Teacher ID format');
    }

    // 2. Validate Teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new ApiError(404, 'Teacher not found');
    }

    // 3. Parse and validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime())) {
      throw new ApiError(400, 'Invalid startTime format');
    }

    if (isNaN(end.getTime())) {
      throw new ApiError(400, 'Invalid endTime format');
    }

    // 4. Validate endTime > startTime
    if (end.getTime() <= start.getTime()) {
      throw new ApiError(400, 'endTime must be greater than startTime');
    }

    // 5. Create Session with default status AVAILABLE
    const session = await Session.create({
      teacherId: new Types.ObjectId(teacherId),
      userId: null,
      startTime: start,
      endTime: end,
      status: SessionStatus.AVAILABLE,
      completedAt: null,
    });

    return session;
  }

  /**
   * API 3: Available Sessions for Booking
   * Return all AVAILABLE sessions for the supplied date.
   * MANDATORY REQUIREMENT: Implemented using MongoDB Aggregation Pipeline.
   */
  public async getAvailableSessions(dateTimestamp: string | number): Promise<any[]> {
    if (!dateTimestamp) {
      throw new ApiError(400, 'dateTimestamp query parameter is required');
    }

    let parsedDate: Date;
    // Check if numeric string or number (e.g. timestamp in ms or seconds)
    if (typeof dateTimestamp === 'number' || !isNaN(Number(dateTimestamp))) {
      const tsNum = Number(dateTimestamp);
      // If timestamp is in seconds (10 digits), convert to ms
      parsedDate = new Date(tsNum < 1e11 ? tsNum * 1000 : tsNum);
    } else {
      parsedDate = new Date(dateTimestamp);
    }

    if (isNaN(parsedDate.getTime())) {
      throw new ApiError(400, 'Invalid dateTimestamp format. Provide ISO string or millisecond timestamp');
    }

    // Calculate start of day (00:00:00.000) and end of day (23:59:59.999) for the given date
    const startOfDay = new Date(parsedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(parsedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // MongoDB Aggregation Pipeline
    const availableSessions = await Session.aggregate([
      // Stage 1: Match AVAILABLE sessions starting within the specified date range
      {
        $match: {
          status: SessionStatus.AVAILABLE,
          startTime: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      // Stage 2: Join with teachers collection for teacher details
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      // Stage 3: Unwind the teacher array
      {
        $unwind: {
          path: '$teacher',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 4: Project clean representation
      {
        $project: {
          _id: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          createdAt: 1,
          teacher: {
            _id: '$teacher._id',
            fullName: '$teacher.fullName',
            email: '$teacher.email',
            specialization: '$teacher.specialization',
            experience: '$teacher.experience',
          },
        },
      },
      // Stage 5: Sort chronologically by startTime
      {
        $sort: {
          startTime: 1,
        },
      },
    ]);

    return availableSessions;
  }

  /**
   * API 4: Book Session
   * Rules:
   * - User must exist.
   * - Session must exist.
   * - Only AVAILABLE sessions can be booked.
   * - A booked session cannot be booked again.
   * - Update session status to BOOKED and associate it with the user.
   */
  public async bookSession(sessionId: string, userId: string): Promise<ISession> {
    // 1. Validate Session ID format
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, 'Invalid Session ID format');
    }

    // 2. Validate User ID format
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Valid userId is required in request body');
    }

    // 3. Verify User exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // 4. Verify Session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // 5. Verify Session is in AVAILABLE status
    if (session.status !== SessionStatus.AVAILABLE) {
      throw new ApiError(
        400,
        `Session cannot be booked. Current status is '${session.status}'`
      );
    }

    // 6. Atomically update session status to BOOKED and set userId (concurrency safe)
    const updatedSession = await Session.findOneAndUpdate(
      {
        _id: new Types.ObjectId(sessionId),
        status: SessionStatus.AVAILABLE,
      },
      {
        $set: {
          status: SessionStatus.BOOKED,
          userId: new Types.ObjectId(userId),
        },
      },
      {
        new: true,
      }
    ).populate('teacherId', 'fullName email specialization experience')
     .populate('userId', 'fullName email phone');

    if (!updatedSession) {
      throw new ApiError(400, 'Session is no longer available or was booked by another user');
    }

    return updatedSession;
  }

  /**
   * API 5: Mark Session Complete
   * Rules:
   * - Session must exist.
   * - Only BOOKED sessions can be marked as completed.
   * - Update status to COMPLETED and set completedAt.
   */
  public async completeSession(sessionId: string): Promise<ISession> {
    // 1. Validate Session ID format
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, 'Invalid Session ID format');
    }

    // 2. Verify Session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // 3. Verify Session is currently BOOKED
    if (session.status !== SessionStatus.BOOKED) {
      throw new ApiError(
        400,
        `Only BOOKED sessions can be marked as completed. Current status is '${session.status}'`
      );
    }

    // 4. Update status to COMPLETED and set completedAt
    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date();
    await session.save();

    // Re-populate teacher and user details
    await session.populate('teacherId', 'fullName email specialization experience');
    await session.populate('userId', 'fullName email phone');

    return session;
  }
}

export const sessionService = new SessionService();
