import { 
  GreenApiWebhook, 
  IntegrationError,
  MessageTransformer as GreenApiMessageTransformer,
  Message,
  StateInstanceWebhook
} from "@green-api/greenapi-integration";
import { TelegramWebhook, TelegramPlatformMessage } from "../types/telegram";
import { MessageTransformer } from "./message-transformer";
import { StatusTransformer } from "./status-transformer";
import { StateTransformer } from "./state-transformer";
import { SQLiteStorage } from "../storage/storage";

export class TelegramTransformer extends GreenApiMessageTransformer<TelegramWebhook, TelegramPlatformMessage> {
  private messageTransformer: MessageTransformer;
  private statusTransformer: StatusTransformer;
  private stateTransformer: StateTransformer;

  constructor(private storage: SQLiteStorage) {
    super();
    this.messageTransformer = new MessageTransformer(storage);
    this.statusTransformer = new StatusTransformer(storage);
    this.stateTransformer = new StateTransformer(storage);
  }

  toPlatformMessage(webhook: GreenApiWebhook, language: string = 'en'): TelegramPlatformMessage {
    switch (webhook.typeWebhook) {
      case "incomingMessageReceived":
        return this.messageTransformer.handleIncomingMessage(webhook, language);
      
      case "outgoingMessageStatus":
        return this.statusTransformer.handleOutgoingMessageStatus(webhook, language);
      
      case "stateInstanceChanged":
        return this.stateTransformer.handleStateInstanceChanged(webhook, language);
      
      default:
        throw new IntegrationError(
          `Unsupported webhook type: ${webhook.typeWebhook}`,
          "UNSUPPORTED_WEBHOOK_TYPE",
          400
        );
    }
  }

  getAdditionalMessages(webhook: GreenApiWebhook, language: string = 'en'): TelegramPlatformMessage[] {
    if (webhook.typeWebhook !== "incomingMessageReceived") {
      return [];
    }
    return this.messageTransformer.getAdditionalMessages(webhook, language);
  }

  async handleStateInstanceChangedWithUser(webhook: StateInstanceWebhook, language: string = 'en'): Promise<TelegramPlatformMessage> {
    return this.stateTransformer.handleStateInstanceChangedWithUser(webhook, language);
  }

  toGreenApiMessage(telegramWebhook: TelegramWebhook): Message {
    console.log('[TRANSFORMER] Sending message to WhatsApp...');
    try {
      const message = telegramWebhook.message || telegramWebhook.edited_message;
      if (!message) {
        throw new IntegrationError("No message found in Telegram webhook", "INVALID_WEBHOOK", 400);
      }

      const telegramChatId = message.chat.id.toString();

      if (message.text) {
        return {
          type: "text",
          chatId: telegramChatId,
          message: message.text
        };
      }

      if (message.photo && message.photo.length > 0) {
        const photo = message.photo[message.photo.length - 1];
        return {
          type: "url-file",
          chatId: telegramChatId,
          file: {
            url: `https://api.telegram.org/file/bot{token}/${photo.file_id}`,
            fileName: `photo_${message.message_id}.jpg`
          },
          caption: message.caption
        };
      }

      if (message.document) {
        return {
          type: "url-file",
          chatId: telegramChatId,
          file: {
            url: `https://api.telegram.org/file/bot{token}/${message.document.file_id}`,
            fileName: message.document.file_name || `document_${message.message_id}`
          },
          caption: message.caption
        };
      }

      if (message.location) {
        return {
          type: "location",
          chatId: telegramChatId,
          latitude: message.location.latitude,
          longitude: message.location.longitude
        };
      }

      if (message.contact) {
        return {
          type: "contact",
          chatId: telegramChatId,
          contact: {
            phoneContact: parseInt(message.contact.phone_number),
            firstName: message.contact.first_name,
            lastName: message.contact.last_name
          }
        };
      }

      throw new IntegrationError(
        "Unsupported Telegram message type",
        "UNSUPPORTED_MESSAGE_TYPE",
        400
      );
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }
      throw new IntegrationError(
        `Failed to transform Telegram webhook to GREEN-API format: ${error}`,
        "TRANSFORMATION_ERROR",
        500
      );
    }
  }
}