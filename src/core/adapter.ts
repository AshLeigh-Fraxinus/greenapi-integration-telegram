import { BaseAdapter, Instance, IntegrationError, StateInstanceWebhook } from "@green-api/greenapi-integration";
import { TelegramWebhook, TelegramPlatformMessage } from "../types/types";
import { TelegramTransformer } from "./telegram.transformer"
import { TelegramBot } from "../client/telegram.client";
import { SQLiteStorage } from "./storage";
export class TelegramAdapter extends BaseAdapter<TelegramWebhook, TelegramPlatformMessage> {
  
  public constructor(
    storage: SQLiteStorage,
  ) {
    const transformer = new TelegramTransformer(storage);
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
    const defaultTypes = ['incomingMessageReceived', 'outgoingMessageStatus', 'stateInstanceChanged'];
    const types = allowedTypes && allowedTypes.length > 0 ? allowedTypes : defaultTypes;
    
    console.log("[ADAPTER] Processing webhook type:", webhook.typeWebhook);

    console.log("[ADAPTER] Processing webhook type:", webhook.typeWebhook);
  console.log("[ADAPTER] Allowed types:", types);
  console.log("[ADAPTER] Is type allowed?", types.includes(webhook.typeWebhook));

    if (!types.includes(webhook.typeWebhook)) {
      console.error("[ADAPTER] Webhook type not allowed. Full webhook:", JSON.stringify(webhook, null, 2));
      throw new IntegrationError(
        `Webhook type ${webhook.typeWebhook} not allowed. Allowed: ${types.join(', ')}`,
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

    const targetChatId = await (this.storage as SQLiteStorage).getTargetChatId(user.chat_id) || user.chat_id;
    
    console.log("[ADAPTER] Sending message to chat ID:", targetChatId);

    let mainMessage: TelegramPlatformMessage;
    
    if (webhook.typeWebhook === "stateInstanceChanged") {
      mainMessage = await (this.transformer as TelegramTransformer).handleStateInstanceChangedWithUser(webhook);
    } else {
      mainMessage = this.transformer.toPlatformMessage(webhook);
    }
    
    const messageWithChatId = { ...mainMessage, chat_id: targetChatId };
    await this.sendToPlatform(messageWithChatId, idInstance);
    console.log("[ADAPTER] WhatsApp message", webhook.typeWebhook, 'sent to', targetChatId)

    if (webhook.typeWebhook === "incomingMessageReceived") {
      const additionalMessages = (this.transformer as TelegramTransformer).getAdditionalMessages(webhook);
      
      for (const additionalMessage of additionalMessages) {
        const additionalWithChatId = { ...additionalMessage, chat_id: targetChatId };
        await this.sendToPlatform(additionalWithChatId, idInstance);
        console.log("[ADAPTER] Additional message for WhatsApp message", webhook.typeWebhook, 'sent to', targetChatId)
      }
    }
  }
}