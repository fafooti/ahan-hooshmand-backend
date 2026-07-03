import { createServer } from 'http';
import { createApp } from './app';
import { config, validateProductionConfig } from './config';
import { initSocket } from './socket';

validateProductionConfig();

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

const app = createApp();
const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});
