import express from 'express';
import { TelegramAdapter } from './core/adapter';
import { TelegramTransformer } from './core/telegram.transformer';
import { SQLiteStorage } from './core/storage';
import { TelegramHandler } from './handlers/handler';
import { AuthenticationError } from '@green-api/greenapi-integration';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const storage = new SQLiteStorage();
const transformer = new TelegramTransformer(storage);
const adapter = new TelegramAdapter(storage);
const telegramHandler = new TelegramHandler(storage);

router.post('/whatsapp', async (req, res) => {
  try {
    await adapter.handleGreenApiWebhook(req.body);
    res.status(200).json({status: 'ok'});
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({error: 'Ошибка аутентификации'});
      return;
    }
    console.error('Ошибка обработки вебхука GREEN API:', error);
    res.status(500).json({error: 'Внутренняя ошибка сервера'});
  }
});

router.post('/telegram', async (req, res) => {
  try {
    const result = await telegramHandler.handleWebhook(req);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    console.error('Ошибка обработки вебхука Telegram:', error);
    res.status(500).json({error: 'Внутренняя ошибка сервера'});
  }
});

export default router;