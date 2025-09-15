// Global test setup
import { Socket } from 'net';

// Mock console.log and console.error during tests unless specifically needed
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
} as any;

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});