import { createServer } from 'net';
import Connection from './connection';

export default createServer((socket) => {
    const clientIP = socket.remoteAddress || 'unknown';
    const clientPort = socket.remotePort || 0;
    console.log(`[SERVER] New client connected from ${clientIP}:${clientPort}`);
    new Connection(socket);
});