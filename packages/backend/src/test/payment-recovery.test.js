import { PaymentRecoveryCron } from '../jobs/payment-recovery-cron.js';

// Mock database pool
const mockPool = {
  query: jest.fn(),
};

// Mock database service
jest.mock('../services/database.js', () => ({
  getPool: () => mockPool
}));

describe('PaymentRecoveryCron', () => {
  let paymentRecoveryCron;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    paymentRecoveryCron = new PaymentRecoveryCron();
    
    // Mock environment variables
    process.env.ALCHEMY_RPC_URL = 'https://test-alchemy.com';
    process.env.BOT_WALLET_ADDRESS = '0xcCBE95Ab1E3ECfb73cFeA072460E24D5054c28B2';
  });

  afterEach(() => {
    if (paymentRecoveryCron.job) {
      paymentRecoveryCron.stop();
    }
  });

  describe('findOrphanedPayments', () => {
    it('should return empty array when environment variables are missing', async () => {
      // Temporarily remove environment variables
      const originalAlchemyUrl = process.env.ALCHEMY_RPC_URL;
      const originalBotWallet = process.env.BOT_WALLET_ADDRESS;
      
      delete process.env.ALCHEMY_RPC_URL;
      delete process.env.BOT_WALLET_ADDRESS;

      const result = await paymentRecoveryCron.findOrphanedPayments();
      
      expect(result).toEqual([]);
      
      // Restore environment variables
      process.env.ALCHEMY_RPC_URL = originalAlchemyUrl;
      process.env.BOT_WALLET_ADDRESS = originalBotWallet;
    });

    it('should find orphaned payments correctly', async () => {
      // Mock latest block response
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: '0x1234567' // Latest block
          })
        })
        // Mock asset transfers response
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              transfers: [
                {
                  hash: '0xorphaned1',
                  from: '0xSender1',
                  to: process.env.BOT_WALLET_ADDRESS,
                  value: 0.002,
                  asset: 'ETH',
                  blockNum: '0x1234560'
                },
                {
                  hash: '0xprocessed1',
                  from: '0xSender2',
                  to: process.env.BOT_WALLET_ADDRESS,
                  value: 0.002,
                  asset: 'ETH',
                  blockNum: '0x1234561'
                }
              ]
            }
          })
        });

      // Mock database responses - first payment not found, second found
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Orphaned payment not in DB
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Processed payment in DB

      const result = await paymentRecoveryCron.findOrphanedPayments();
      
      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe('0xorphaned1');
      expect(result[0].value).toBe(0.002);
    });

    it('should handle API errors gracefully', async () => {
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            error: { message: 'API error' }
          })
        });

      const result = await paymentRecoveryCron.findOrphanedPayments();
      
      expect(result).toEqual([]);
    });

    it('should filter out non-membership payments', async () => {
      global.fetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: '0x1234567'
          })
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            result: {
              transfers: [
                {
                  hash: '0xwrongamount',
                  from: '0xSender1',
                  to: process.env.BOT_WALLET_ADDRESS,
                  value: 0.001, // Wrong amount
                  asset: 'ETH',
                  blockNum: '0x1234560'
                },
                {
                  hash: '0xwrongasset',
                  from: '0xSender2',
                  to: process.env.BOT_WALLET_ADDRESS,
                  value: 0.002,
                  asset: 'USDC', // Wrong asset
                  blockNum: '0x1234561'
                }
              ]
            }
          })
        });

      const result = await paymentRecoveryCron.findOrphanedPayments();
      
      expect(result).toHaveLength(0);
    });
  });

  describe('processOrphanedPayment', () => {
    const mockPayment = {
      hash: '0xorphaned1',
      from: '0xSender1',
      to: process.env.BOT_WALLET_ADDRESS,
      value: 0.002,
      blockNum: '0x1234560'
    };

    it('should create recovery record for new orphaned payment', async () => {
      // Mock no existing recovery record
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing recovery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert successful

      const result = await paymentRecoveryCron.processOrphanedPayment(mockPayment);
      
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payment_recoveries'),
        expect.arrayContaining([
          mockPayment.hash,
          mockPayment.from,
          mockPayment.value,
          parseInt(mockPayment.blockNum, 16)
        ])
      );
    });

    it('should skip payment if recovery record already exists', async () => {
      // Mock existing recovery record
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Existing recovery

      const result = await paymentRecoveryCron.processOrphanedPayment(mockPayment);
      
      expect(result).toBe(false);
      expect(mockPool.query).toHaveBeenCalledTimes(1); // Only the check query
    });

    it('should handle database errors', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing recovery
        .mockRejectedValueOnce(new Error('Database error')); // Insert fails

      const result = await paymentRecoveryCron.processOrphanedPayment(mockPayment);
      
      expect(result).toBe(false);
    });
  });

  describe('processOrphanedPayments', () => {
    it('should process multiple orphaned payments', async () => {
      const mockPayments = [
        { hash: '0xorphaned1', from: '0xSender1', value: 0.002, blockNum: '0x1' },
        { hash: '0xorphaned2', from: '0xSender2', value: 0.002, blockNum: '0x2' }
      ];

      // Mock findOrphanedPayments
      jest.spyOn(paymentRecoveryCron, 'findOrphanedPayments')
        .mockResolvedValue(mockPayments);

      // Mock processOrphanedPayment
      jest.spyOn(paymentRecoveryCron, 'processOrphanedPayment')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      await paymentRecoveryCron.processOrphanedPayments();

      expect(paymentRecoveryCron.processOrphanedPayment).toHaveBeenCalledTimes(2);
    });

    it('should handle no orphaned payments', async () => {
      jest.spyOn(paymentRecoveryCron, 'findOrphanedPayments')
        .mockResolvedValue([]);

      await paymentRecoveryCron.processOrphanedPayments();

      expect(paymentRecoveryCron.findOrphanedPayments).toHaveBeenCalledTimes(1);
    });

    it('should handle processing errors and continue', async () => {
      const mockPayments = [
        { hash: '0xorphaned1', from: '0xSender1', value: 0.002, blockNum: '0x1' },
        { hash: '0xorphaned2', from: '0xSender2', value: 0.002, blockNum: '0x2' }
      ];

      jest.spyOn(paymentRecoveryCron, 'findOrphanedPayments')
        .mockResolvedValue(mockPayments);

      jest.spyOn(paymentRecoveryCron, 'processOrphanedPayment')
        .mockRejectedValueOnce(new Error('Processing error'))
        .mockResolvedValueOnce(true);

      await paymentRecoveryCron.processOrphanedPayments();

      expect(paymentRecoveryCron.processOrphanedPayment).toHaveBeenCalledTimes(2);
    });
  });

  describe('cron job lifecycle', () => {
    it('should start and stop correctly', () => {
      expect(paymentRecoveryCron.job).toBeNull();
      
      paymentRecoveryCron.start();
      expect(paymentRecoveryCron.job).toBeTruthy();
      
      paymentRecoveryCron.stop();
      expect(paymentRecoveryCron.job.running).toBe(false);
    });

    it('should prevent concurrent execution', async () => {
      paymentRecoveryCron.isRunning = true;
      
      jest.spyOn(paymentRecoveryCron, 'findOrphanedPayments');
      
      await paymentRecoveryCron.processOrphanedPayments();
      
      expect(paymentRecoveryCron.findOrphanedPayments).not.toHaveBeenCalled();
    });
  });
});