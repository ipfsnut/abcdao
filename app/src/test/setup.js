import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Suppress logs during tests for cleaner output
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);

// Mock fetch globally for blockchain tests
global.fetch = jest.fn();