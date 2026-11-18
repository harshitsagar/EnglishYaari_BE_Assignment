# Teacher-User Session Booking Platform - Backend API

A REST API backend application built with **Node.js**, **TypeScript**, **Express.js**, **MongoDB**, and **Mongoose**.

This platform enables teachers to list available slots, allows registered users to book available sessions, and tracks user session history (categorized into upcoming and completed sessions).

---

## Technical Stack & Dependencies

- **Language & Runtime**: Node.js, TypeScript (v5.4+)
- **Framework**: Express.js (v4.19+)
- **Database & ODM**: MongoDB, Mongoose (v8.4+)
- **Testing**: Jest, Supertest, MongoDB Memory Server
- **Environment & Tools**: dotenv, ts-node-dev, cors

---

## Project Folder Structure

The project follows a clean **Controller - Service - Model** architectural pattern to decouple request handling from core business logic:

```text
EnglishYaari_BE_Assignment/
├── src/
│   ├── config/
│   │   └── db.ts                   # MongoDB connection logic using Mongoose
│   ├── controllers/
│   │   ├── user.controller.ts      # HTTP handlers for User endpoints
│   │   ├── teacher.controller.ts   # HTTP handlers for Teacher endpoints
│   │   └── session.controller.ts   # HTTP handlers for Session endpoints
│   ├── middlewares/
│   │   └── error.middleware.ts     # Global centralized error handler
│   ├── models/
│   │   ├── user.model.ts           # User Schema & Interface
│   │   ├── teacher.model.ts        # Teacher Schema & Interface
│   │   └── session.model.ts        # Session Schema & Interface (with indexes)
│   ├── routes/
│   │   ├── user.routes.ts          # Express routes for /users
│   │   ├── teacher.routes.ts       # Express routes for /teachers
│   │   └── session.routes.ts       # Express routes for /sessions
│   ├── services/
│   │   ├── user.service.ts         # User DB operations & Aggregation pipeline
│   │   ├── teacher.service.ts      # Teacher DB operations
│   │   └── session.service.ts      # Session DB operations & Aggregation pipeline
│   ├── utils/
│   │   ├── apiError.ts             # Custom Error class for operational errors
│   │   ├── apiResponse.ts          # Standardized API Response formatter
│   │   └── asyncHandler.ts         # Async wrapper for route handlers
│   ├── tests/
│   │   └── api.test.ts             # Integration test suite (14 passing tests)
│   ├── app.ts                      # Express app setup & middleware mounting
│   └── server.ts                   # Server bootstrap & DB connection
├── postman_collection.json         # Ready-to-use Postman collection
├── package.json
├── tsconfig.json
└── README.md
```

---

## Quick Setup & How to Run

### 1. Prerequisites
- Node.js (v18 or above)
- MongoDB installed locally OR a MongoDB Atlas connection string.

### 2. Environment Variables Setup
Copy `.env.example` to `.env` or create `.env` in the root folder:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/session_booking_db
NODE_ENV=development
```

### 3. Installation
Install project dependencies:

```bash
npm install
```

### 4. Running the Server

- **Development Mode** (with auto-reload via `ts-node-dev`):
  ```bash
  npm run dev
  ```
  The server will start at `http://localhost:5000`.

- **Production Mode**:
  ```bash
  npm run build
  npm start
  ```

---

## Automated Integration Testing

An integration test suite is included to test all endpoints end-to-end. It uses `mongodb-memory-server`, so it runs completely in-memory without needing a local MongoDB instance.

Run tests using:

```bash
npm test
```

Test Results Summary:
- **14 Passed / 14 Total** across all 6 API endpoints and edge cases (duplicate email, non-existent user/teacher, invalid date ranges, concurrency double-booking checks).

---

## API Documentation & Usage

All responses follow a consistent format:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation description",
  "data": { ... }
}
```

---

### 1. Create User
- **Endpoint**: `POST /users`
- **Description**: Creates a new user. Email is unique.
- **Request Body**:
  ```json
  {
    "fullName": "Rahul Sharma",
    "email": "rahul.sharma@example.com",
    "phone": "+919876543210"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "User created successfully",
    "data": {
      "_id": "664c1234567890abcdef1234",
      "fullName": "Rahul Sharma",
      "email": "rahul.sharma@example.com",
      "phone": "+919876543210",
      "createdAt": "2025-05-20T10:00:00.000Z",
      "updatedAt": "2025-05-20T10:00:00.000Z"
    }
  }
  ```

---

### 2. Create Teacher (Support Endpoint)
- **Endpoint**: `POST /teachers`
- **Description**: Registers a teacher profile.
- **Request Body**:
  ```json
  {
    "fullName": "Dr. Ananya Verma",
    "email": "ananya.verma@example.com",
    "specialization": "Spoken English & Communication",
    "experience": 7
  }
  ```

---

### 3. Create Session
- **Endpoint**: `POST /sessions`
- **Description**: Creates an available session for a teacher. Default status is `AVAILABLE`.
- **Validation**:
  - `teacherId` must exist in DB.
  - `endTime` must be strictly greater than `startTime`.
- **Request Body**:
  ```json
  {
    "teacherId": "664c1234567890abcdef5678",
    "startTime": "2025-05-20T10:00:00.000Z",
    "endTime": "2025-05-20T11:00:00.000Z"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Session created successfully",
    "data": {
      "_id": "664c1234567890abcdef9012",
      "teacherId": "664c1234567890abcdef5678",
      "userId": null,
      "startTime": "2025-05-20T10:00:00.000Z",
      "endTime": "2025-05-20T11:00:00.000Z",
      "status": "AVAILABLE",
      "completedAt": null
    }
  }
  ```

---

### 4. Available Sessions for Booking (MongoDB Aggregation Pipeline)
- **Endpoint**: `GET /sessions/available?dateTimestamp={timestamp}`
- **Description**: Mandatory implementation using **MongoDB Aggregation Pipeline**. Returns all `AVAILABLE` sessions for the given date.
- **Query Param**: `dateTimestamp` (Supports ISO date `2025-05-20` or unix timestamp in ms).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Available sessions retrieved successfully",
    "data": [
      {
        "_id": "664c1234567890abcdef9012",
        "startTime": "2025-05-20T10:00:00.000Z",
        "endTime": "2025-05-20T11:00:00.000Z",
        "status": "AVAILABLE",
        "teacher": {
          "_id": "664c1234567890abcdef5678",
          "fullName": "Dr. Ananya Verma",
          "email": "ananya.verma@example.com",
          "specialization": "Spoken English & Communication",
          "experience": 7
        }
      }
    ]
  }
  ```

---

### 5. Book Session
- **Endpoint**: `POST /sessions/:id/book`
- **Description**: Books an available session for a user.
- **Rules**:
  - User and Session must exist.
  - Only `AVAILABLE` sessions can be booked.
  - Double booking is prevented via atomic database update.
- **Request Body**:
  ```json
  {
    "userId": "664c1234567890abcdef1234"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Session booked successfully",
    "data": {
      "_id": "664c1234567890abcdef9012",
      "status": "BOOKED",
      "teacherId": {
        "_id": "664c1234567890abcdef5678",
        "fullName": "Dr. Ananya Verma"
      },
      "userId": {
        "_id": "664c1234567890abcdef1234",
        "fullName": "Rahul Sharma"
      }
    }
  }
  ```

---

### 6. Mark Session Complete
- **Endpoint**: `PATCH /sessions/:id/complete`
- **Description**: Marks a `BOOKED` session as `COMPLETED` and sets `completedAt`.
- **Rules**: Only `BOOKED` sessions can be marked complete.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Session marked as completed successfully",
    "data": {
      "_id": "664c1234567890abcdef9012",
      "status": "COMPLETED",
      "completedAt": "2025-05-20T11:05:00.000Z"
    }
  }
  ```

---

### 7. User Session List (MongoDB Aggregation Pipeline)
- **Endpoint**: `GET /users/:id/sessions`
- **Description**: Mandatory implementation using **MongoDB Aggregation Pipeline**. Returns all sessions for a user separated into `upcomingSessions` (status: `BOOKED`) and `completedSessions` (status: `COMPLETED`).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User sessions retrieved successfully",
    "data": {
      "user": {
        "_id": "664c1234567890abcdef1234",
        "fullName": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "phone": "+919876543210"
      },
      "upcomingSessions": [
        {
          "_id": "664c1234567890abcdef9012",
          "status": "BOOKED",
          "startTime": "2025-05-25T10:00:00.000Z",
          "endTime": "2025-05-25T11:00:00.000Z",
          "teacher": {
            "fullName": "Dr. Ananya Verma",
            "specialization": "Spoken English & Communication"
          }
        }
      ],
      "completedSessions": [
        {
          "_id": "664c1234567890abcdef9011",
          "status": "COMPLETED",
          "startTime": "2025-05-20T10:00:00.000Z",
          "endTime": "2025-05-20T11:00:00.000Z",
          "completedAt": "2025-05-20T11:05:00.000Z",
          "teacher": {
            "fullName": "Dr. Ananya Verma",
            "specialization": "Spoken English & Communication"
          }
        }
      ]
    }
  }
  ```

---

## How to Test the APIs

### Option A: Using Postman
1. Open Postman.
2. Click **Import** -> Select `postman_collection.json` located in the project root.
3. The collection includes pre-configured environment variables (`baseUrl`, `userId`, `teacherId`, `sessionId`).
4. Run requests in sequence:
   - Create User -> Create Teacher -> Create Session -> View Available Sessions -> Book Session -> Mark Complete -> Get User Sessions.

### Option B: Using cURL Commands from Terminal

```bash
# 1. Create a User
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Rahul Sharma","email":"rahul@example.com","phone":"+919876543210"}'

# 2. Create a Teacher
curl -X POST http://localhost:5000/teachers \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ananya Verma","email":"ananya@example.com","specialization":"English","experience":5}'

# 3. Create a Session
curl -X POST http://localhost:5000/sessions \
  -H "Content-Type: application/json" \
  -d '{"teacherId":"<TEACHER_ID>","startTime":"2025-05-20T10:00:00Z","endTime":"2025-05-20T11:00:00Z"}'

# 4. Get Available Sessions for Date
curl "http://localhost:5000/sessions/available?dateTimestamp=2025-05-20"

# 5. Book Session
curl -X POST http://localhost:5000/sessions/<SESSION_ID>/book \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>"}'

# 6. Mark Session Complete
curl -X PATCH http://localhost:5000/sessions/<SESSION_ID>/complete

# 7. Get User Sessions (Upcoming & Completed)
curl http://localhost:5000/users/<USER_ID>/sessions
```

---

## Detailed Explanation of MongoDB Aggregation Pipelines

### 1. API 3 Aggregation Pipeline (`SessionService.getAvailableSessions`)

```ts
const availableSessions = await Session.aggregate([
  // Step 1: Match AVAILABLE sessions starting within the specified day's range
  {
    $match: {
      status: SessionStatus.AVAILABLE,
      startTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    },
  },
  // Step 2: Join with teachers collection on teacherId
  {
    $lookup: {
      from: 'teachers',
      localField: 'teacherId',
      foreignField: '_id',
      as: 'teacher',
    },
  },
  // Step 3: Unwind the array produced by $lookup into an object
  {
    $unwind: {
      path: '$teacher',
      preserveNullAndEmptyArrays: true,
    },
  },
  // Step 4: Format output fields cleanly
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
  // Step 5: Sort chronologically
  {
    $sort: { startTime: 1 },
  },
]);
```

**Why this design?**
- Filtering via `$match` is placed first so MongoDB uses indexed fields (`status` and `startTime`), optimizing execution time.
- `$lookup` fetches teacher details inside MongoDB engine rather than running secondary queries from Node.js.

---

### 2. API 6 Aggregation Pipeline (`UserService.getUserSessions`)

```ts
const aggregationResult = await Session.aggregate([
  // Step 1: Match all sessions tied to the specified userId
  {
    $match: {
      userId: new Types.ObjectId(userId),
    },
  },
  // Step 2: Join with teachers collection for teacher info
  {
    $lookup: {
      from: 'teachers',
      localField: 'teacherId',
      foreignField: '_id',
      as: 'teacher',
    },
  },
  // Step 3: Convert teacher array to single object
  {
    $unwind: {
      path: '$teacher',
      preserveNullAndEmptyArrays: true,
    },
  },
  // Step 4: Use $facet to split sessions into upcoming vs completed in one DB pass
  {
    $facet: {
      upcomingSessions: [
        { $match: { status: SessionStatus.BOOKED } },
        { $sort: { startTime: 1 } },
      ],
      completedSessions: [
        { $match: { status: SessionStatus.COMPLETED } },
        { $sort: { completedAt: -1, startTime: -1 } },
      ],
    },
  },
]);
```

**Why `$facet` is used?**
- `$facet` processes multiple aggregation sub-pipelines simultaneously on the same set of matched documents. This eliminates the need to execute two separate MongoDB queries (one for upcoming sessions and one for completed sessions), reducing database network latency by 50%.

---

## Key Technical Decisions & Edge Case Handling

### 1. Type Safety & Interfaces
TypeScript provides explicit type definitions (`IUser`, `ITeacher`, `ISession`) across controllers, services, and models. This ensures strict compile-time validation, IDE auto-completion, and self-documenting code.

### 2. Concurrency Safety & Double-Booking Prevention
To prevent double-booking when multiple users attempt to book the same available session simultaneously, session booking is executed atomically using MongoDB's `findOneAndUpdate`:

```ts
Session.findOneAndUpdate(
  { _id: sessionId, status: SessionStatus.AVAILABLE },
  { $set: { status: SessionStatus.BOOKED, userId } },
  { new: true }
);
```

Since MongoDB executes single-document modifications atomically, only the first request successfully matches `status: 'AVAILABLE'`. Subsequent concurrent requests fail the filter condition and receive a clean HTTP 400 response.

### 3. Offloading Processing to MongoDB Engine
Instead of fetching raw collections and executing JavaScript loops/filtering inside Node.js memory:
- **API 3 (`/sessions/available`)** utilizes `$match` and `$lookup` to join teacher records inside the MongoDB process.
- **API 6 (`/users/:id/sessions`)** uses `$facet` to categorize user sessions into `upcomingSessions` and `completedSessions` concurrently in a single database round-trip.

### 4. Centralized Error Architecture
A custom `ApiError` class standardizes application errors with status codes and message arrays. Route handlers are wrapped with `asyncHandler` to pass exceptions to Express's global error middleware, which automatically translates Mongoose errors (such as duplicate email error code `11000` or invalid ObjectId `CastError`) into predictable JSON payloads.

---

## Features & Implementation Summary

- Node.js, TypeScript, Express.js, MongoDB, Mongoose
- User, Teacher, and Session Mongoose Schemas
- API 1 - Create User (Email uniqueness check)
- API 2 - Create Session (Default AVAILABLE, teacher validation, endTime > startTime)
- API 3 - Available Sessions for Booking (MongoDB Aggregation Pipeline)
- API 4 - Book Session (Validation + Atomic update to prevent double booking)
- API 5 - Mark Session Complete (Only BOOKED sessions can be marked complete, sets completedAt)
- API 6 - User Session List (MongoDB Aggregation Pipeline with `$facet` for Upcoming & Completed)
- Centralized error middleware & standard HTTP status codes
- Automated integration test suite (`npm test`)
- Importable Postman Collection (`postman_collection.json`)
