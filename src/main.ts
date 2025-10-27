import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import webhookRouter from './webhook.controller';

dotenv.config();

async function bootstrap() {
  const app = express();
  
  app.use(bodyParser.json());
  app.use('/webhook', webhookRouter);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

bootstrap().catch(console.error);