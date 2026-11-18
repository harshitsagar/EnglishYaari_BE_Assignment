import { Request, Response } from 'express';
import { sessionService } from '../services/session.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class SessionController {
  /**
   * API 2 - Create Session
   * POST /sessions
   */
  public createSession = asyncHandler(async (req: Request, res: Response) => {
    const { teacherId, startTime, endTime } = req.body;

    if (!teacherId || !startTime || !endTime) {
      throw new ApiError(400, 'teacherId, startTime, and endTime are required fields');
    }

    const session = await sessionService.createSession({
      teacherId,
      startTime,
      endTime,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, session, 'Session created successfully'));
  });

  /**
   * API 3 - Available Sessions for Booking
   * GET /sessions/available?dateTimestamp={timestamp}
   */
  public getAvailableSessions = asyncHandler(async (req: Request, res: Response) => {
    const { dateTimestamp } = req.query;

    if (!dateTimestamp) {
      throw new ApiError(400, 'dateTimestamp query parameter is required');
    }

    const availableSessions = await sessionService.getAvailableSessions(
      dateTimestamp as string
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          availableSessions,
          'Available sessions retrieved successfully'
        )
      );
  });

  /**
   * API 4 - Book Session
   * POST /sessions/:id/book
   */
  public bookSession = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      throw new ApiError(400, 'userId is required in body to book session');
    }

    const bookedSession = await sessionService.bookSession(id, userId);

    return res
      .status(200)
      .json(new ApiResponse(200, bookedSession, 'Session booked successfully'));
  });

  /**
   * API 5 - Mark Session Complete
   * PATCH /sessions/:id/complete
   */
  public completeSession = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const completedSession = await sessionService.completeSession(id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, completedSession, 'Session marked as completed successfully')
      );
  });
}

export const sessionController = new SessionController();
