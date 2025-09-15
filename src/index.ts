import { createServer } from 'node:net';

const server = createServer((socket) => {
  console.log('Client connected');

  socket.on('data', (data) => {
    console.log('Received data:', data.toString());
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
