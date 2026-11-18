import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { User } from '../models/user.model';
import { Teacher } from '../models/teacher.model';
import { Session, SessionStatus } from '../models/session.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Teacher.deleteMany({});
  await Session.deleteMany({});
});

describe('Session Booking Platform API Test Suite', () => {
  let sampleUser: any;
  let sampleTeacher: any;

  beforeEach(async () => {
    // Create baseline teacher and user
    sampleTeacher = await Teacher.create({
      fullName: 'Dr. Sarah Connor',
      email: 'sarah.connor@example.com',
      specialization: 'English Spoken Communication',
      experience: 8,
    });

    sampleUser = await User.create({
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+19876543210',
    });
  });

  // ==========================================
  // API 1: Create User
  // ==========================================
  describe('POST /users (API 1 - Create User)', () => {
    it('should create a new user with valid data', async () => {
      const res = await request(app).post('/users').send({
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+12345678901',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.email).toBe('jane.smith@example.com');
    });

    it('should return 409 conflict when email already exists', async () => {
      const res = await request(app).post('/users').send({
        fullName: 'Duplicate User',
        email: 'john.doe@example.com', // Already registered
        phone: '+12345678901',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists|Duplicate/i);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/users').send({
        fullName: 'Incomplete User',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // API 2: Create Session
  // ==========================================
  describe('POST /sessions (API 2 - Create Session)', () => {
    it('should create a session with default status AVAILABLE', async () => {
      const startTime = new Date(Date.now() + 3600000).toISOString();
      const endTime = new Date(Date.now() + 7200000).toISOString();

      const res = await request(app).post('/sessions').send({
        teacherId: sampleTeacher._id.toString(),
        startTime,
        endTime,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SessionStatus.AVAILABLE);
      expect(res.body.data.teacherId).toBe(sampleTeacher._id.toString());
    });

    it('should return 404 if teacher does not exist', async () => {
      const fakeTeacherId = new mongoose.Types.ObjectId().toString();
      const startTime = new Date(Date.now() + 3600000).toISOString();
      const endTime = new Date(Date.now() + 7200000).toISOString();

      const res = await request(app).post('/sessions').send({
        teacherId: fakeTeacherId,
        startTime,
        endTime,
      });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Teacher not found');
    });

    it('should return 400 if endTime is less than or equal to startTime', async () => {
      const startTime = new Date(Date.now() + 7200000).toISOString();
      const endTime = new Date(Date.now() + 3600000).toISOString(); // Earlier than startTime

      const res = await request(app).post('/sessions').send({
        teacherId: sampleTeacher._id.toString(),
        startTime,
        endTime,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('endTime must be greater than startTime');
    });
  });

  // ==========================================
  // API 3: Available Sessions for Booking (Aggregation)
  // ==========================================
  describe('GET /sessions/available (API 3 - Available Sessions Pipeline)', () => {
    it('should return all AVAILABLE sessions for the specified date timestamp', async () => {
      const today = new Date();
      const sessionDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      const start = new Date(`${sessionDateStr}T10:00:00.000Z`);
      const end = new Date(`${sessionDateStr}T11:00:00.000Z`);

      // Create an AVAILABLE session for today
      await Session.create({
        teacherId: sampleTeacher._id,
        startTime: start,
        endTime: end,
        status: SessionStatus.AVAILABLE,
      });

      // Create a BOOKED session for today (should not be returned)
      await Session.create({
        teacherId: sampleTeacher._id,
        userId: sampleUser._id,
        startTime: new Date(`${sessionDateStr}T12:00:00.000Z`),
        endTime: new Date(`${sessionDateStr}T13:00:00.000Z`),
        status: SessionStatus.BOOKED,
      });

      const res = await request(app)
        .get(`/sessions/available?dateTimestamp=${sessionDateStr}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe(SessionStatus.AVAILABLE);
      expect(res.body.data[0].teacher.fullName).toBe('Dr. Sarah Connor');
    });
  });

  // ==========================================
  // API 4: Book Session
  // ==========================================
  describe('POST /sessions/:id/book (API 4 - Book Session)', () => {
    let availableSession: any;

    beforeEach(async () => {
      availableSession = await Session.create({
        teacherId: sampleTeacher._id,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        status: SessionStatus.AVAILABLE,
      });
    });

    it('should successfully book an AVAILABLE session', async () => {
      const res = await request(app)
        .post(`/sessions/${availableSession._id}/book`)
        .send({ userId: sampleUser._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SessionStatus.BOOKED);
      expect(res.body.data.userId._id).toBe(sampleUser._id.toString());
    });

    it('should prevent booking an already BOOKED session', async () => {
      // First booking
      await request(app)
        .post(`/sessions/${availableSession._id}/book`)
        .send({ userId: sampleUser._id.toString() });

      // Second booking attempt
      const res = await request(app)
        .post(`/sessions/${availableSession._id}/book`)
        .send({ userId: sampleUser._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be booked/i);
    });

    it('should return 404 if user does not exist', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/sessions/${availableSession._id}/book`)
        .send({ userId: fakeUserId });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  // ==========================================
  // API 5: Mark Session Complete
  // ==========================================
  describe('PATCH /sessions/:id/complete (API 5 - Mark Session Complete)', () => {
    it('should mark a BOOKED session as COMPLETED and set completedAt', async () => {
      const bookedSession = await Session.create({
        teacherId: sampleTeacher._id,
        userId: sampleUser._id,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
        status: SessionStatus.BOOKED,
      });

      const res = await request(app).patch(
        `/sessions/${bookedSession._id}/complete`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SessionStatus.COMPLETED);
      expect(res.body.data.completedAt).not.toBeNull();
    });

    it('should return 400 if trying to complete an AVAILABLE session', async () => {
      const availableSession = await Session.create({
        teacherId: sampleTeacher._id,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        status: SessionStatus.AVAILABLE,
      });

      const res = await request(app).patch(
        `/sessions/${availableSession._id}/complete`
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Only BOOKED sessions can be marked as completed/i);
    });
  });

  // ==========================================
  // API 6: User Session List (Aggregation)
  // ==========================================
  describe('GET /users/:id/sessions (API 6 - User Session List Pipeline)', () => {
    it('should return upcoming and completed sessions for a user separately using aggregation', async () => {
      // 1. Upcoming session (BOOKED)
      await Session.create({
        teacherId: sampleTeacher._id,
        userId: sampleUser._id,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        status: SessionStatus.BOOKED,
      });

      // 2. Completed session (COMPLETED)
      await Session.create({
        teacherId: sampleTeacher._id,
        userId: sampleUser._id,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
        status: SessionStatus.COMPLETED,
        completedAt: new Date(Date.now() - 3600000),
      });

      const res = await request(app).get(`/users/${sampleUser._id}/sessions`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('upcomingSessions');
      expect(res.body.data).toHaveProperty('completedSessions');
      expect(res.body.data.upcomingSessions.length).toBe(1);
      expect(res.body.data.completedSessions.length).toBe(1);
      expect(res.body.data.upcomingSessions[0].teacher.fullName).toBe('Dr. Sarah Connor');
    });

    it('should return 404 if user is not found', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/users/${fakeUserId}/sessions`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });
});
