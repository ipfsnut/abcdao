import request from 'supertest';
import express from 'express';
import paymentRecoveryRoutes from '../routes/payment-recovery.js';

// Mock database pool
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

// Mock database service
jest.mock('../services/database.js', () => ({
  getPool: () => mockPool
}));

describe('Payment Recovery Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', paymentRecoveryRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/payment-recoveries', () => {
    it('should fetch payment recoveries with default status', async () => {
      const mockRecoveries = [
        {
          id: 1,
          transaction_hash: '0x123',
          from_address: '0xSender',
          amount_eth: '0.002',
          status: 'pending_review',
          detected_at: new Date().toISOString()
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockRecoveries });

      const response = await request(app)
        .get('/api/admin/payment-recoveries');

      expect(response.status).toBe(200);
      expect(response.body.recoveries).toEqual(mockRecoveries);
      expect(response.body.total).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pr.status = $1'),
        ['pending_review']
      );
    });

    it('should fetch payment recoveries with custom status', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/admin/payment-recoveries?status=processed');

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pr.status = $1'),
        ['processed']
      );
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/payment-recoveries');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch payment recoveries');
    });
  });

  describe('POST /api/admin/payment-recoveries/:id/process', () => {
    beforeEach(() => {
      mockPool.connect.mockResolvedValue(mockClient);
    });

    it('should reject invalid action', async () => {
      const response = await request(app)
        .post('/api/admin/payment-recoveries/1/process')
        .send({ action: 'invalid_action' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid action');
    });

    it('should ignore payment recovery', async () => {
      const mockRecovery = {
        id: 1,
        transaction_hash: '0x123',
        from_address: '0xSender',
        amount_eth: '0.002'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockRecovery] }) // SELECT recovery
        .mockResolvedValueOnce(undefined) // UPDATE to ignored
        .mockResolvedValueOnce(undefined); // COMMIT

      const response = await request(app)
        .post('/api/admin/payment-recoveries/1/process')
        .send({
          action: 'ignore',
          admin_notes: 'Spam transaction'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment recovery ignored');
    });

    it('should match payment to existing user', async () => {
      const mockRecovery = {
        id: 1,
        transaction_hash: '0x123',
        from_address: '0xSender',
        amount_eth: '0.002'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockRecovery] }) // SELECT recovery
        .mockResolvedValueOnce(undefined) // UPDATE to matched
        .mockResolvedValueOnce(undefined); // COMMIT

      const response = await request(app)
        .post('/api/admin/payment-recoveries/1/process')
        .send({
          action: 'match',
          matched_user_id: 123,
          admin_notes: 'Matched to existing user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment recovery matched to user');
    });

    it('should process payment recovery with new user creation', async () => {
      const mockRecovery = {
        id: 1,
        transaction_hash: '0x123',
        from_address: '0xSender',
        amount_eth: '0.002'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockRecovery] }) // SELECT recovery
        .mockResolvedValueOnce({ rows: [{ id: 456 }] }) // INSERT new user
        .mockResolvedValueOnce(undefined) // INSERT membership
        .mockResolvedValueOnce(undefined) // UPDATE recovery
        .mockResolvedValueOnce(undefined); // COMMIT

      const response = await request(app)
        .post('/api/admin/payment-recoveries/1/process')
        .send({
          action: 'process',
          farcaster_fid: 12345,
          farcaster_username: 'newuser',
          admin_notes: 'Created new user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment recovery processed and membership created');
      expect(response.body.user_id).toBe(456);
    });

    it('should process payment recovery with existing user update', async () => {
      const mockRecovery = {
        id: 1,
        transaction_hash: '0x123',
        from_address: '0xSender',
        amount_eth: '0.002'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockRecovery] }) // SELECT recovery
        .mockResolvedValueOnce(undefined) // UPDATE existing user
        .mockResolvedValueOnce(undefined) // INSERT membership
        .mockResolvedValueOnce(undefined) // UPDATE recovery
        .mockResolvedValueOnce(undefined); // COMMIT

      const response = await request(app)
        .post('/api/admin/payment-recoveries/1/process')
        .send({
          action: 'process',
          matched_user_id: 789,
          admin_notes: 'Updated existing user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user_id).toBe(789);
    });

    it('should reject processing without user details', async () => {
      const mockRecovery = {
        id: 1,
        transaction_hash: '0x123',
        from_address: '0xSender',
        amount_eth: '0.002'
      };

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockRecovery] }) // SELECT recovery
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const response = await request(app)
        .post('/api/admin/payment-recoveries/1/process')
        .send({
          action: 'process',
          admin_notes: 'Missing user details'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID or Farcaster details required for processing');
    });

    it('should handle recovery not found', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT recovery (not found)

      const response = await request(app)
        .post('/api/admin/payment-recoveries/999/process')
        .send({ action: 'ignore' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Payment recovery not found');
    });

    it('should handle database transaction errors', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // SELECT fails

      const response = await request(app)
        .post('/api/admin/payment-recoveries/1/process')
        .send({ action: 'ignore' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to process payment recovery');
    });
  });

  describe('GET /api/admin/users/search', () => {
    it('should search users by username', async () => {
      const mockUsers = [
        {
          id: 1,
          farcaster_fid: 12345,
          farcaster_username: 'testuser',
          github_username: 'testuser-gh',
          membership_status: 'free'
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      const response = await request(app)
        .get('/api/admin/users/search?query=testuser');

      expect(response.status).toBe(200);
      expect(response.body.users).toEqual(mockUsers);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        ['%testuser%', 'testuser']
      );
    });

    it('should search users by FID', async () => {
      const mockUsers = [
        {
          id: 1,
          farcaster_fid: 12345,
          farcaster_username: 'testuser',
          membership_status: 'paid'
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockUsers });

      const response = await request(app)
        .get('/api/admin/users/search?query=12345');

      expect(response.status).toBe(200);
      expect(response.body.users).toEqual(mockUsers);
    });

    it('should reject short queries', async () => {
      const response = await request(app)
        .get('/api/admin/users/search?query=a');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query must be at least 2 characters');
    });

    it('should reject missing query', async () => {
      const response = await request(app)
        .get('/api/admin/users/search');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query must be at least 2 characters');
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/users/search?query=testuser');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to search users');
    });
  });
});