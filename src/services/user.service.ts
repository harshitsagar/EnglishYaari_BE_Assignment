import { Types } from 'mongoose';
import { User, IUser } from '../models/user.model';
import { Session, SessionStatus } from '../models/session.model';
import { ApiError } from '../utils/apiError';

export class UserService {
  /**
   * API 1: Create a new user
   */
  public async createUser(userData: {
    fullName: string;
    email: string;
    phone: string;
  }): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const user = await User.create({
      fullName: userData.fullName,
      email: userData.email.toLowerCase(),
      phone: userData.phone,
    });

    return user;
  }

  /**
   * Get user by ID helper
   */
  public async getUserById(userId: string): Promise<IUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid User ID format');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  /**
   * API 6: User Session List separated into Upcoming & Completed Sessions
   * MANDATORY REQUIREMENT: Implemented using MongoDB Aggregation Pipeline
   */
  public async getUserSessions(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid User ID format');
    }

    // Verify user exists first
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const userObjectId = new Types.ObjectId(userId);

    // MongoDB Aggregation Pipeline to classify sessions
    const aggregationResult = await Session.aggregate([
      // Stage 1: Match sessions associated with this user
      {
        $match: {
          userId: userObjectId,
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
      // Stage 3: Unwind teacher array
      {
        $unwind: {
          path: '$teacher',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 4: Facet to separate sessions into upcoming and completed
      {
        $facet: {
          upcomingSessions: [
            {
              $match: {
                status: SessionStatus.BOOKED,
              },
            },
            {
              $sort: {
                startTime: 1,
              },
            },
          ],
          completedSessions: [
            {
              $match: {
                status: SessionStatus.COMPLETED,
              },
            },
            {
              $sort: {
                completedAt: -1,
                startTime: -1,
              },
            },
          ],
        },
      },
    ]);

    const result = aggregationResult[0] || {
      upcomingSessions: [],
      completedSessions: [],
    };

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
      upcomingSessions: result.upcomingSessions,
      completedSessions: result.completedSessions,
    };
  }
}

export const userService = new UserService();
