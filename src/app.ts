import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { getCorsOptions } from './config';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors(getCorsOptions()));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
