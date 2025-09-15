import { createServer } from 'net';

export default createServer((socket) => {
  console.log('Client connected');

  socket.on('data', (data) => {
    console.log('Received data:', data.toString());
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});