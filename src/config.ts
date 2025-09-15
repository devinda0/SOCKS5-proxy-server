import 'dotenv/config';

const parsePort = (portStr: string): number => {
  const port = parseInt(portStr, 10);
  return isNaN(port) ? 3000 : port;
};

export const PROXY_PORT = process.env.PROXY_PORT ? parsePort(process.env.PROXY_PORT) : 3000;

export const AUTH_USERNAME = process.env.AUTH_USERNAME || 'username';
export const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'password';