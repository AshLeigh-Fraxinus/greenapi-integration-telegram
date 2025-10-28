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
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      params: {
        url: fullWebhookUrl,
        drop_pending_updates: true // Опционально: удалить ожидающие обновления
      }
    });

    if (response.data.ok) {
      console.log(`[MAIN] Telegram вебхук успешно установлен: ${fullWebhookUrl}`);
    } else {
      console.error('[MAIN] Ошибка установки Telegram вебхука:', response.data.description);
    }
  } catch (error) {
    console.error('[MAIN] Ошибка при установке Telegram вебхука:', error);
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