import { BaseAdapter, Instance, IntegrationError, StateInstanceWebhook } from "@green-api/greenapi-integration";
import { TelegramWebhook, TelegramPlatformMessage } from "../types/telegram";
import { TelegramTransformer } from "../transformers"
import { TelegramBot } from "../client/telegram.client";
import { SQLiteStorage } from "../storage/storage";
import { Localization } from "../utils/localization";

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
    const idInstance = webhook.instanceData.idInstance;
    const user = await (this.storage as SQLiteStorage).findUserByInstanceId(idInstance);
    if (!user) {
      throw new IntegrationError(
        `User for instance ${idInstance} not found`,
        "USER_NOT_FOUND",
        404
      );
    }

    const notificationSettings = await (this.storage as SQLiteStorage).getNotificationSettings(user.chat_id);

    let isAllowed = false;

    switch (webhook.typeWebhook) {
      case "incomingMessageReceived":
        isAllowed = notificationSettings.incomingWebhook;
        break;
      case "outgoingMessageStatus":
        isAllowed = notificationSettings.outgoingWebhook;
        break;
      case "stateInstanceChanged":
        isAllowed = notificationSettings.stateWebhook;
        break;
      default:
        isAllowed = false;
    }

    if (!isAllowed) {
      console.log("[ADAPTER] Webhook type not allowed by user settings, skipping");
      return; 
    }
    
    const targetChatId = await (this.storage as SQLiteStorage).getTargetChatId(user.chat_id) || user.chat_id;
    
    console.log("[ADAPTER] Sending message to chat ID:", targetChatId);

    let mainMessage: TelegramPlatformMessage;
    
    if (webhook.typeWebhook === "stateInstanceChanged") {
      mainMessage = await (this.transformer as TelegramTransformer).handleStateInstanceChangedWithUser(webhook, user.language || 'en');
    } else {
      mainMessage = (this.transformer as TelegramTransformer).toPlatformMessage(webhook, user.language || 'en');
    }
    
    const messageWithChatId = { ...mainMessage, chat_id: targetChatId };
    await this.sendToPlatform(messageWithChatId, idInstance);
    console.log("[ADAPTER] WhatsApp message", webhook.typeWebhook, 'sent to', targetChatId)

    if (webhook.typeWebhook === "incomingMessageReceived") {
      const additionalMessages = (this.transformer as TelegramTransformer).getAdditionalMessages(webhook, user.language || 'en');
      
      for (const additionalMessage of additionalMessages) {
        const additionalWithChatId = { ...additionalMessage, chat_id: targetChatId };
        await this.sendToPlatform(additionalWithChatId, idInstance);
        console.log("[ADAPTER] Additional message for WhatsApp message", webhook.typeWebhook, 'sent to', targetChatId)
      }
    }
  }
}