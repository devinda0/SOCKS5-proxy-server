# SOCKS5 Proxy Server

A lightweight, secure SOCKS5 proxy server implementation written in TypeScript/Node.js with support for username/password authentication.

## Features

- 🚀 **Full SOCKS5 Protocol Support** - Complete implementation of RFC 1928
- 🔐 **Authentication** - Username/password authentication support
- 🌐 **IPv4 & Domain Support** - Handles both IPv4 addresses and domain names
- 📝 **TypeScript** - Written in TypeScript for type safety and better development experience
- 🧪 **Well Tested** - Comprehensive test coverage with Jest
- ⚙️ **Configurable** - Environment-based configuration
- 📊 **Logging** - Detailed connection logging for monitoring

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/devinda0/SOCKS5-proxy-server.git
cd SOCKS5-proxy-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
cp .env.example .env
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production build and start
npm run start
```

The server will start on port 3000 by default.

## Configuration

You can configure the server using environment variables or by creating a `.env` file:

```env
# Server Configuration
PROXY_PORT=3000

# Authentication (optional)
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_password
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PROXY_PORT` | `3000` | Port number for the SOCKS5 proxy server |
| `AUTH_USERNAME` | `username` | Username for authentication (if required) |
| `AUTH_PASSWORD` | `password` | Password for authentication (if required) |

## Usage

### Basic Connection

Once the server is running, you can configure any SOCKS5-compatible client to use it:

- **Host**: `localhost` (or your server's IP)
- **Port**: `3000` (or your configured port)
- **Authentication**: Username/Password (if configured)

### Testing with curl

Test the proxy server using curl:

```bash
# Without authentication
curl -v --socks5 localhost:3000 http://httpbin.org/get

# With authentication
curl -v --socks5 username:password@localhost:3000 http://httpbin.org/get
```

## Development

### Available Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Project Structure

```
src/
├── index.ts        # Application entry point
├── server.ts       # TCP server setup
├── connection.ts   # SOCKS5 connection handling
├── auth.ts         # Authentication logic
├── config.ts       # Configuration management
└── constants.ts    # SOCKS5 protocol constants

tests/
├── connection.test.ts  # Connection class tests
├── setup.ts           # Test setup configuration
└── test-utils.ts      # Testing utilities
```

### Architecture

The server follows a modular architecture:

- **Server**: Creates TCP server and handles incoming connections
- **Connection**: Manages individual SOCKS5 connections through different stages
- **Authentication**: Handles username/password validation
- **Config**: Centralized configuration management

### SOCKS5 Protocol Implementation

The server implements the complete SOCKS5 handshake:

1. **Greeting Stage**: Client sends supported authentication methods
2. **Authentication Stage**: Username/password authentication (if required)
3. **Request Stage**: Client sends connection request (CONNECT command)
4. **Relay Stage**: Data relay between client and target server

## Testing

The project includes comprehensive tests covering:

- Connection handling and state management
- SOCKS5 protocol compliance
- Authentication flows
- Error handling scenarios

Run tests with coverage:

```bash
npm run test:coverage
```

View the coverage report by opening `coverage/index.html` in your browser.

## Security Considerations

- **Authentication**: Always use strong usernames and passwords in production
- **Network**: Consider running behind a firewall or VPN
- **Logging**: Monitor connection logs for suspicious activity
- **Rate Limiting**: Consider implementing rate limiting for production use

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   Solution: Change the port in your `.env` file or kill the process using the port.

2. **Connection Refused**
   ```
   curl: (7) Failed to connect to localhost port 3000: Connection refused
   ```
   Solution: Ensure the server is running and the port is correct.

3. **Authentication Failed**
   ```
   curl: (97) Use --socks5-hostname instead
   ```
   Solution: Check username/password configuration and ensure they match.

### Debug Mode

Enable verbose logging by setting the log level in your environment or check the console output when running in development mode.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Maintain code coverage above 80%
- Use meaningful commit messages

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built following [RFC 1928](https://tools.ietf.org/html/rfc1928) - SOCKS Protocol Version 5
- Inspired by the need for a lightweight, TypeScript-based SOCKS5 implementation

## Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Search existing [issues](https://github.com/devinda0/SOCKS5-proxy-server/issues)
3. Create a new issue with detailed information

## Changelog

### v1.0.0
- Initial release
- Full SOCKS5 protocol support
- Username/password authentication
- TypeScript implementation
- Comprehensive test suite