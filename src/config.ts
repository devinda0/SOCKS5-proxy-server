import 'dotenv/config';

export const PROXY_PORT = process.env.PROXY_PORT ? parseInt(process.env.PROXY_PORT, 10) : 3000;

