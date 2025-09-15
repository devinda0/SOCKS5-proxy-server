import { createServer } from 'net';
import Connection from './connection';

export default createServer((socket) => {
    console.log('New client connected');
    console.log(socket.remoteAddress, socket.remotePort);
    new Connection(socket);
    console.log('Connection instance created');
});