import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const message = `Duplicate value entered for ${keys.join(', ')} field(s). Value must be unique.`;
    error = new ApiError(409, message, [`Duplicate key: ${keys.join(', ')}`]);
  }

  // Handle Mongoose Invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid format for field '${err.path}': ${err.value}`;
    error = new ApiError(400, message, [message]);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    const message = `Validation error: ${errors.join('. ')}`;
    error = new ApiError(400, message, errors);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
