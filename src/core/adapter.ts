import { BaseAdapter, Instance, IntegrationError, StateInstanceWebhook } from "@green-api/greenapi-integration";
import { TelegramWebhook, TelegramPlatformMessage } from "../types/types";
import { TelegramTransformer } from "./transformer"
import { TelegramBot } from "../client/telegram.client";
import { SQLiteStorage } from "./storage";

export class TelegramAdapter extends BaseAdapter<TelegramWebhook, TelegramPlatformMessage> {
  
  public constructor(
    storage: SQLiteStorage,
    transformer: TelegramTransformer,
  ) {
    super(transformer, storage);
  }

  async createPlatformClient(params: any): Promise<TelegramBot> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new IntegrationError("Bot token not found", "MISSING_BOT_TOKEN", 400);
    }
    return new TelegramBot(botToken);
  }

  async sendToPlatform(message: TelegramPlatformMessage, instance: Instance): Promise<void> {
    const client = await this.createPlatformClient(instance);
    await client.send(message); 
  }

  async handleGreenApiWebhook(webhook: any, allowedTypes?: string[]): Promise<void> {
    const types = allowedTypes || ['incomingMessageReceived', 'outgoingMessageStatus', 'stateInstanceChanged'];
    console.log("[ADAPTER] New WhatsApp webhook on Instance", webhook.instanceData.idInstance, ':',  webhook.typeWebhook,)

    if (!types.includes(webhook.typeWebhook)) {
      throw new IntegrationError(
        `Webhook type ${webhook.typeWebhook} not allowed`,
        "WEBHOOK_TYPE_NOT_ALLOWED",
        400
      );
    }

    const idInstance = webhook.instanceData.idInstance;
    const user = await (this.storage as SQLiteStorage).findUserByInstanceId(idInstance);
    if (!user) {
      throw new IntegrationError(
        `User for instance ${idInstance} not found`,
        "USER_NOT_FOUND",
        404
      );
    }

    const mainMessage = this.transformer.toPlatformMessage(webhook);
    
    const messageWithChatId = { ...mainMessage, chat_id: user.chat_id };
    await this.sendToPlatform(messageWithChatId, idInstance);
    console.log("[ADAPTER] WhatsApp messsage", webhook.typeWebhook, 'sent to', user.chat_id)

    if (webhook.typeWebhook === "incomingMessageReceived") {
      const additionalMessages = (this.transformer as TelegramTransformer).getAdditionalMessages(webhook);
      
      for (const additionalMessage of additionalMessages) {
        const additionalWithChatId = { ...additionalMessage, chat_id: user.chat_id };
        await this.sendToPlatform(additionalWithChatId, idInstance);
        console.log("[ADAPTER] Additional message for WhatsApp messsage", webhook.typeWebhook, 'sent to', user.chat_id)
      }
    }
  }
}