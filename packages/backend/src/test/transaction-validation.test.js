import request from 'supertest';
import express from 'express';
import transactionValidationRoutes from '../routes/transaction-validation.js';

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

describe('Transaction Validation API', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', transactionValidationRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    
    // Default environment variables for tests
    process.env.ALCHEMY_RPC_URL = 'https://test-alchemy.com';
    process.env.BOT_WALLET_ADDRESS = '0x475579e65E140B11bc4656dD4b05e0CADc8366eB';
  });

  describe('POST /api/auth/validate-transaction', () => {
    const validRequest = {
      transaction_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      farcaster_fid: 12345,
      farcaster_username: 'testuser'
    };

    it('should reject invalid transaction hash format', async () => {
      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send({
          ...validRequest,
          transaction_hash: 'invalid-hash'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid transaction hash format');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send({
          transaction_hash: validRequest.transaction_hash
          // missing farcaster_fid and farcaster_username
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Transaction hash, Farcaster FID, and username required');
    });

    it('should reject already processed transactions', async () => {
      // Mock existing transaction
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Existing transaction

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Transaction already processed');
    });

    it('should reject user with existing paid membership', async () => {
      // Mock no existing transaction but user with paid membership
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing transaction
        .mockResolvedValueOnce({ rows: [{ id: 1, membership_status: 'paid' }] }); // User with paid membership

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already has paid membership');
    });

    it('should reject invalid blockchain transaction', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing transaction
        .mockResolvedValueOnce({ rows: [] }); // No existing user

      // Mock invalid blockchain response
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              blockNumber: '0x123456',
              value: '0x71afd498d0000', // Correct amount
              to: '0xWrongAddress', // Wrong recipient
              from: '0xSenderAddress'
            }
          })
        });

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid recipient');
    });

    it('should successfully validate and create new user with valid transaction', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing transaction
        .mockResolvedValueOnce({ rows: [] }); // No existing user

      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 123 }] }) // INSERT user
        .mockResolvedValueOnce(undefined) // INSERT membership
        .mockResolvedValueOnce(undefined); // COMMIT

      // Mock valid blockchain response
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              blockNumber: '0x123456',
              value: '0x71afd498d0000', // 0.002 ETH
              to: process.env.BOT_WALLET_ADDRESS.toLowerCase(),
              from: '0xSenderAddress'
            }
          })
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              timestamp: '0x64a7c2b0' // Mock timestamp
            }
          })
        });

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Transaction validated and membership activated!');
      expect(response.body.user_id).toBe(123);
    });

    it('should successfully validate and update existing user', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing transaction
        .mockResolvedValueOnce({ rows: [{ id: 456, membership_status: 'free' }] }); // Existing free user

      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined) // UPDATE user
        .mockResolvedValueOnce(undefined) // INSERT membership
        .mockResolvedValueOnce(undefined); // COMMIT

      // Mock valid blockchain response
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              blockNumber: '0x123456',
              value: '0x71afd498d0000', // 0.002 ETH
              to: process.env.BOT_WALLET_ADDRESS.toLowerCase(),
              from: '0xSenderAddress'
            }
          })
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              timestamp: '0x64a7c2b0'
            }
          })
        });

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user_id).toBe(456);
    });

    it('should handle blockchain validation errors gracefully', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing transaction
        .mockResolvedValueOnce({ rows: [] }); // No existing user

      // Mock blockchain error
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            error: { message: 'Transaction not found' }
          })
        });

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('RPC error');
    });

    it('should handle missing environment variables', async () => {
      // Remove environment variables
      delete process.env.ALCHEMY_RPC_URL;
      delete process.env.BOT_WALLET_ADDRESS;

      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing transaction
        .mockResolvedValueOnce({ rows: [] }); // No existing user

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should validate transaction amount correctly', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing transaction
        .mockResolvedValueOnce({ rows: [] }); // No existing user

      // Mock transaction with wrong amount
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              blockNumber: '0x123456',
              value: '0x38d7ea4c68000', // 0.001 ETH (wrong amount)
              to: process.env.BOT_WALLET_ADDRESS.toLowerCase(),
              from: '0xSenderAddress'
            }
          })
        });

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid amount');
      expect(response.body.error).toContain('Expected 0.002 ETH');
    });

    it('should handle unconfirmed transactions', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing transaction
        .mockResolvedValueOnce({ rows: [] }); // No existing user

      // Mock unconfirmed transaction (no blockNumber)
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              blockNumber: null, // Unconfirmed
              value: '0x71afd498d0000',
              to: process.env.BOT_WALLET_ADDRESS.toLowerCase(),
              from: '0xSenderAddress'
            }
          })
        });

      const response = await request(app)
        .post('/api/auth/validate-transaction')
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Transaction not yet confirmed');
    });
  });
});