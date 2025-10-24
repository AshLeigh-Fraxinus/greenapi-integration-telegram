import { AuthenticationError, IntegrationError } from "@green-api/greenapi-integration";
import { Router } from "express";
import express from "express";

import { TelegramTransformer } from "./telegram/telegram-transformer";
import { TelegramHandler } from "./telegram/telegram-handler";
import { TelegramAdapter } from "./telegram/telegram-adapter"
import { SQLiteStorage } from "./telegram/storage";

import dotenv from 'dotenv';
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not configured in environment variables');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = new SQLiteStorage();
const transformer = new TelegramTransformer();
const adapter = new TelegramAdapter(storage, transformer);
const telegramHandler = new TelegramHandler(storage, adapter);

const webhookRouter = Router();

webhookRouter.post("/telegram", async (req, res) => {
  console.log('Telegram Webhook Received:', {
    timestamp: new Date().toISOString(), 
    body: JSON.stringify(req.body, null, 2)
  });

  try {
    const result = await telegramHandler.handleWebhook(req);
    
    if (result.statusCode) {
      res.status(result.statusCode).json({ 
        status: result.status, 
        error: result.error 
      });
    } else {
      res.status(200).json({ status: result.status });
    }
  } catch (error) {
    console.log("Unexpected error in Telegram webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

webhookRouter.post("/whatsapp", async (req, res) => {
  console.log('Green API Webhook Received:', {
    timestamp: new Date().toISOString(), 
    body: JSON.stringify(req.body, null, 2)
  });

  try {
    await adapter.handleGreenApiWebhook(req.body, [
      'incomingMessageReceived',
      'outgoingMessageStatus',
      'stateInstanceChanged'
    ]);
    
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.log("Failed to handle GREEN-API webhook:", {
        path: req.path,
        method: req.method,
        error: error
    });
    if (error instanceof AuthenticationError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof IntegrationError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.use("/webhook", webhookRouter);

app.use((req, res, next) => {
  next();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
