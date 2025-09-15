import { Socket } from 'net';
import Connection from '../src/connection';
import {
  MockSocket,
  MockTargetSocket,
  createGreetingMessage,
  createAuthMessage,
  createConnectRequestIPv4,
  createConnectRequestDomain,
  waitFor
} from './test-utils';
import { AUTH_METHODS, REPLIES, SOCKS_VERSION, COMMANDS } from '../src/constants';

// Mock the auth module
jest.mock('../src/auth', () => ({
  authenticate: jest.fn()
}));

// Mock the Socket constructor for target connections
jest.mock('net', () => {
  const originalNet = jest.requireActual('net');
  return {
    ...originalNet,
    Socket: jest.fn().mockImplementation(() => new MockTargetSocket())
  };
});

describe('Connection Class', () => {
  let mockSocket: MockSocket;
  let connection: Connection;
  let mockAuthenticate: jest.MockedFunction<any>;

  beforeEach(() => {
    mockSocket = new MockSocket();
    mockAuthenticate = require('../src/auth').authenticate;
    mockAuthenticate.mockClear();
  });

  describe('Constructor and initialization', () => {
    it('should create a connection and set up event listeners', () => {
      connection = new Connection(mockSocket as any);
      
      expect(mockSocket.listenerCount('data')).toBe(1);
      expect(mockSocket.listenerCount('error')).toBe(1);
      expect(mockSocket.listenerCount('close')).toBe(1);
      expect(mockSocket.listenerCount('end')).toBe(1);
    });
  });

  describe('SOCKS5 Protocol - Greeting Stage', () => {
    beforeEach(() => {
      connection = new Connection(mockSocket as any);
      mockSocket.clearWritten();
    });

    it('should handle greeting with no authentication', () => {
      const greetingMessage = createGreetingMessage([AUTH_METHODS.NO_AUTHENTICATION_REQUIRED]);
      
      mockSocket.simulateData(greetingMessage);
      
      const response = mockSocket.getWrittenData();
      expect(response).toEqual(Buffer.from([SOCKS_VERSION, AUTH_METHODS.NO_AUTHENTICATION_REQUIRED]));
    });

    it('should handle greeting with username/password authentication', () => {
      const greetingMessage = createGreetingMessage([AUTH_METHODS.USERNAME_PASSWORD]);
      
      mockSocket.simulateData(greetingMessage);
      
      const response = mockSocket.getWrittenData();
      expect(response).toEqual(Buffer.from([SOCKS_VERSION, AUTH_METHODS.USERNAME_PASSWORD]));
    });

    it('should prefer username/password when both methods are available', () => {
      const greetingMessage = createGreetingMessage([
        AUTH_METHODS.NO_AUTHENTICATION_REQUIRED,
        AUTH_METHODS.USERNAME_PASSWORD
      ]);
      
      mockSocket.simulateData(greetingMessage);
      
      const response = mockSocket.getWrittenData();
      expect(response).toEqual(Buffer.from([SOCKS_VERSION, AUTH_METHODS.USERNAME_PASSWORD]));
    });

    it('should reject unsupported authentication methods', () => {
      const greetingMessage = createGreetingMessage([AUTH_METHODS.GSSAPI]);
      
      mockSocket.simulateData(greetingMessage);
      
      const response = mockSocket.getWrittenData();
      expect(response).toEqual(Buffer.from([SOCKS_VERSION, AUTH_METHODS.NO_ACCEPTABLE_METHODS]));
      expect(mockSocket.ended).toBe(true);
    });

    it('should reject invalid SOCKS version', () => {
      const invalidMessage = Buffer.from([0x04, 0x01, 0x00]); // SOCKS4
      
      mockSocket.simulateData(invalidMessage);
      
      expect(mockSocket.destroyed).toBe(true);
    });

    it('should handle empty methods list', () => {
      const greetingMessage = Buffer.from([SOCKS_VERSION, 0x00]); // No methods
      
      mockSocket.simulateData(greetingMessage);
      
      expect(mockSocket.ended).toBe(true);
    });
  });

  describe('SOCKS5 Protocol - Authentication Stage', () => {
    beforeEach(() => {
      connection = new Connection(mockSocket as any);
      mockSocket.clearWritten();
      
      // First, send greeting to enter authentication stage
      const greetingMessage = createGreetingMessage([AUTH_METHODS.USERNAME_PASSWORD]);
      mockSocket.simulateData(greetingMessage);
      mockSocket.clearWritten();
    });

    it('should handle successful authentication', async () => {
      mockAuthenticate.mockReturnValue(true);
      const authMessage = createAuthMessage('testuser', 'testpass');
      
      mockSocket.simulateData(authMessage);
      
      // Wait for async processing
      await waitFor(() => mockSocket.written.length > 0, 500);
      
      const response = mockSocket.getWrittenData();
      expect(response).toEqual(Buffer.from([0x01, 0x00])); // Success
      expect(mockAuthenticate).toHaveBeenCalledWith('testuser', 'testpass');
    });

    it('should handle failed authentication', async () => {
      mockAuthenticate.mockReturnValue(false);
      const authMessage = createAuthMessage('wronguser', 'wrongpass');
      
      mockSocket.simulateData(authMessage);
      
      // Wait for async processing
      await waitFor(() => mockSocket.written.length > 0, 500);
      
      const response = mockSocket.getWrittenData();
      expect(response).toEqual(Buffer.from([0x01, 0x01])); // Failure
      expect(mockSocket.ended).toBe(true);
    });

    it('should handle authentication with special characters', async () => {
      mockAuthenticate.mockReturnValue(true);
      const authMessage = createAuthMessage('user@domain.com', 'p@ssw0rd!');
      
      mockSocket.simulateData(authMessage);
      
      // Wait for async processing
      await waitFor(() => mockSocket.written.length > 0, 500);
      
      const response = mockSocket.getWrittenData();
      expect(response).toEqual(Buffer.from([0x01, 0x00]));
      expect(mockAuthenticate).toHaveBeenCalledWith('user@domain.com', 'p@ssw0rd!');
    });
  });

  describe('SOCKS5 Protocol - Request Stage', () => {
    beforeEach(() => {
      connection = new Connection(mockSocket as any);
      mockSocket.clearWritten();
      
      // Enter request stage (no auth)
      const greetingMessage = createGreetingMessage([AUTH_METHODS.NO_AUTHENTICATION_REQUIRED]);
      mockSocket.simulateData(greetingMessage);
      mockSocket.clearWritten();
    });

    it('should handle IPv4 connect request', async () => {
      const connectRequest = createConnectRequestIPv4('127.0.0.1', 80);
      
      mockSocket.simulateData(connectRequest);
      
      // Wait for async target connection
      await waitFor(() => mockSocket.written.length > 0);
      
      const response = mockSocket.getWrittenData();
      expect(response[0]).toBe(SOCKS_VERSION);
      expect(response[1]).toBe(REPLIES.SUCCEEDED);
    });

    it('should handle domain name connect request', async () => {
      const connectRequest = createConnectRequestDomain('example.com', 80);
      
      mockSocket.simulateData(connectRequest);
      
      // Wait for async target connection
      await waitFor(() => mockSocket.written.length > 0);
      
      const response = mockSocket.getWrittenData();
      expect(response[0]).toBe(SOCKS_VERSION);
      expect(response[1]).toBe(REPLIES.SUCCEEDED);
    });

    it('should reject unsupported commands', () => {
      const bindRequest = Buffer.from([
        SOCKS_VERSION,
        0x02, // BIND command
        0x00, // Reserved
        0x01, // IPv4
        127, 0, 0, 1, // IP
        0x00, 0x50 // Port 80
      ]);
      
      mockSocket.simulateData(bindRequest);
      
      expect(mockSocket.ended).toBe(true);
    });

    it('should reject unsupported address types', () => {
      const ipv6Request = Buffer.from([
        SOCKS_VERSION,
        COMMANDS.CONNECT,
        0x00, // Reserved
        0x04, // IPv6
        ...new Array(16).fill(0), // IPv6 address
        0x00, 0x50 // Port 80
      ]);
      
      mockSocket.simulateData(ipv6Request);
      
      expect(mockSocket.ended).toBe(true);
    });

    it('should handle invalid domain name length', () => {
      const invalidDomainRequest = Buffer.from([
        SOCKS_VERSION,
        COMMANDS.CONNECT,
        0x00, // Reserved
        0x03, // Domain name
        0x00, // Invalid length (0)
        0x00, 0x50 // Port 80
      ]);
      
      mockSocket.simulateData(invalidDomainRequest);
      
      expect(mockSocket.ended).toBe(true);
    });
  });

  describe('Target connection handling', () => {
    beforeEach(() => {
      connection = new Connection(mockSocket as any);
      mockSocket.clearWritten();
      
      // Enter request stage
      const greetingMessage = createGreetingMessage([AUTH_METHODS.NO_AUTHENTICATION_REQUIRED]);
      mockSocket.simulateData(greetingMessage);
      mockSocket.clearWritten();
    });

    it('should create target socket on connect request', async () => {
      const connectRequest = createConnectRequestIPv4('127.0.0.1', 80);
      mockSocket.simulateData(connectRequest);
      
      // Wait for async target connection
      await waitFor(() => mockSocket.written.length > 0);
      
      const response = mockSocket.getWrittenData();
      expect(response[0]).toBe(SOCKS_VERSION);
      expect(response[1]).toBe(REPLIES.SUCCEEDED);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      connection = new Connection(mockSocket as any);
    });

    it('should handle socket errors gracefully', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSocket.simulateError(new Error('Socket error'));
      
      // Should handle gracefully without crashing
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should handle socket close', () => {
      mockSocket.simulateClose();
      
      // Should handle gracefully
      expect(true).toBe(true); // Test that no exception is thrown
    });

    it('should clean up properly on end', () => {
      const endSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      mockSocket.emit('end');
      
      expect(endSpy).toHaveBeenCalledWith('Connection ended by client');
      endSpy.mockRestore();
    });
  });
});