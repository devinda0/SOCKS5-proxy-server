import server from './server';
import { PROXY_PORT } from './config';

server.listen(PROXY_PORT, () => {
  console.log(`Server listening on port ${PROXY_PORT}`);
});
