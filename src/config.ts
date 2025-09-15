import 'dotenv/config';

export const PROXY_PORT = process.env.PROXY_PORT ? parseInt(process.env.PROXY_PORT, 10) : 3000;

export const AUTH_USERNAME = process.env.AUTH_USERNAME || 'username';
export const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'password';