const request = require('supertest');
const { app } = require('../index');
const { User, Bank } = require('../src/models/schema');

describe('Auth Endpoints', () => {
  const validUserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should create a user and return 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body.user).toHaveProperty('email', validUserData.email);
      expect(res.body.user).toHaveProperty('firstName', validUserData.firstName);
      expect(res.body.user).toHaveProperty('lastName', validUserData.lastName);
      expect(res.body.user).not.toHaveProperty('password');

      // Verify user and bank in database
      const dbUser = await User.findOne({ email: validUserData.email });
      expect(dbUser).not.toBeNull();

      const dbBank = await Bank.findOne({ user: dbUser._id });
      expect(dbBank).not.toBeNull();
      expect(dbBank.balance).toBeGreaterThan(0);
    });

    it('should reject duplicate emails with 409', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // Attempt second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });

    it('should reject invalid emails with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'not-an-email',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);
    });

    it('should return a JWT token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', validUserData.email);
    });

    it('should return 400 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 for non-existent user email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
});
