import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class UserController {
  /**
   * API 1 - Create User
   * POST /users
   */
  public createUser = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, phone } = req.body;

    if (!fullName || !email || !phone) {
      throw new ApiError(400, 'fullName, email, and phone are required fields');
    }

    const user = await userService.createUser({ fullName, email, phone });

    return res
      .status(201)
      .json(new ApiResponse(201, user, 'User created successfully'));
  });

  /**
   * API 6 - User Session List
   * GET /users/:id/sessions
   */
  public getUserSessions = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const data = await userService.getUserSessions(id);

    return res
      .status(200)
      .json(new ApiResponse(200, data, 'User sessions retrieved successfully'));
  });
}

export const userController = new UserController();
