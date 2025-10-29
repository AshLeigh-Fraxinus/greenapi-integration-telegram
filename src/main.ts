import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import webhookRouter from './webhook.controller';
import axios from 'axios'

dotenv.config();

async function setupTelegramWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = process.env.WEBHOOK_URL;
  
  if (!botToken || !webhookUrl) {
    console.warn('[MAIN] TELEGRAM_BOT_TOKEN или WEBHOOK_URL не установлены в .env файле. Пропускаем установку вебхука.');
    return;
  }

  const fullWebhookUrl = `${webhookUrl}/webhook/telegram`;
  
  try {

    await axios.get(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      params: { drop_pending_updates: true }
    });

    console.log('[MAIN] Telegram bot webhookUrl is reset');

    const response = await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      url: fullWebhookUrl,
      drop_pending_updates: true
    });

    if (response.data.ok) {
      console.log(`[MAIN] Telegram bot webhookUrl is set: ${fullWebhookUrl}`);
    } else {
      console.error('[MAIN] Telegram bot webhookUrl setting error:', response.data.description);
    }

  } catch (error) {
    console.error('[MAIN] Telegram bot webhookUrl setting error:', error);
  }
}

async function bootstrap() {
  const app = express();
  
  app.use(bodyParser.json());
  app.use('/webhook', webhookRouter);

  await setupTelegramWebhook();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[MAIN] Server is running on port ${port}`);
  });
}

bootstrap().catch(console.error);