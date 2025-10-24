import { BaseAdapter, Instance, IntegrationError } from "@green-api/greenapi-integration";
import { TelegramWebhook, TelegramPlatformMessage, TelegramSendPoll } from "./telegram-types";
import { TelegramTransformer } from "./telegram-transformer";
import { TelegramBot } from "./telegram-client";
import { SQLiteStorage } from "./storage";
import axios from "axios";

export class TelegramAdapter extends BaseAdapter<TelegramWebhook, TelegramPlatformMessage> {
  
  public constructor(
    storage: SQLiteStorage,
    transformer: TelegramTransformer,
  ) {
    super(transformer, storage);
  }

  async createPlatformClient(params: { 
    botToken: string;
    idInstance?: number;
    apiTokenInstance?: any;
  }): Promise<TelegramBot> {
    return new TelegramBot(params.botToken);
  }

  async sendToPlatform(message: TelegramPlatformMessage, instance: Instance): Promise<void> {

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new IntegrationError("Bot token not found", "MISSING_BOT_TOKEN", 400);
    }

    const client = await this.createPlatformClient({ botToken });

    if ('text' in message) {
      await client.sendMessage(message);
    } else if ('photo' in message) {
      await client.sendPhoto(message);
    } else if ('video' in message) {
      await client.sendVideo(message);
    } else if ('audio' in message) {
      await client.sendAudio(message);
    } else if ('question' in message && 'options' in message) {
      await client.sendPoll(message as TelegramSendPoll);
    } else if ('document' in message) {
      await client.sendDocument(message);
    } else if ('latitude' in message) {
      await client.sendLocation(message);
    } else if ('phone_number' in message) {
      await client.sendContact(message);
    } else {
      throw new IntegrationError(
        "Unsupported Telegram message type",
        "UNSUPPORTED_MESSAGE_TYPE",
        400
      );
    }
  }

  async handleGreenApiWebhook(webhook: any, allowedTypes?: string[]): Promise<void> {

    const types = allowedTypes || [
      'incomingMessageReceived',
      'outgoingMessageStatus', 
      'stateInstanceChanged'
    ];

    if (!types.includes(webhook.typeWebhook)) {
      throw new IntegrationError(
        `Webhook type ${webhook.typeWebhook} not allowed`,
        "WEBHOOK_TYPE_NOT_ALLOWED",
        400
      );
    }

    if (webhook.typeWebhook === "incomingMessageReceived") {
      const user = await (this.storage as SQLiteStorage).findUserByInstanceId(webhook.instanceData.idInstance);
      if (!user) {
        throw new IntegrationError(
          `User for instance ${webhook.instanceData.idInstance} not found`,
          "USER_NOT_FOUND",
          404
        );
      }

      const instance = await this.storage.getInstance(webhook.instanceData.idInstance);
      if (!instance) {
        throw new IntegrationError(
          `Instance ${webhook.instanceData.idInstance} not found`,
          "INSTANCE_NOT_FOUND",
          404
        );
      }

      const platformMessages = this.createPlatformMessagesFromWebhook(webhook, user.chat_id);
      
      for (const message of platformMessages) {
        await this.sendToPlatform(message, instance);
      }
    }
  }

  private createPlatformMessagesFromWebhook(webhook: any, telegramChatId: string): TelegramPlatformMessage[] {

    const messageData = webhook.messageData;
    const senderData = webhook.senderData;

    const getSenderInfo = () => {
        if (!senderData) return "";
        
        const senderName = senderData.senderName || senderData.chatName || "Unknown";
        const senderNumber = senderData.sender || senderData.chatId || "Unknown";
        const chatId = String(senderData.chatId || senderData.sender || "");
        
        if (chatId?.endsWith('@c.us')) {
          return `• Отправитель:  ${senderName}\n• Номер: ${senderNumber}\n\n• Получатель: Instance ${webhook.instanceData.idInstance}\n• Номер: ${webhook.instanceData.wid}`;
        } else if (chatId?.endsWith('@g.us')) {
          const chatName = senderData.chatName || "Group Chat";
          const chatId = senderData.chatId || "Group Chat";
          return `• Отправитель:  ${senderName}\n• Номер: ${senderNumber}\n• Группа: ${chatName}\n${chatId}\n\n• Получатель: Instance ${webhook.instanceData.idInstance}\n  Номер:${webhook.instanceData.wid}`;
        } else {
          return `• Отправитель:  ${senderName}\n• Номер: ${senderNumber}\n\n• Получатель: Instance ${webhook.instanceData.idInstance}\n• Номер: ${webhook.instanceData.wid}`;
        }
      };

    const senderInfo = getSenderInfo();
    const header = `✉️ Новое сообщение WhatsApp:\n\n` + `${senderInfo}\n⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭\n\n`;

    switch (messageData.typeMessage) {
      case "textMessage":
        return [{
          chat_id: telegramChatId,
          text: header + messageData.textMessageData.textMessage
        }];

      case "extendedTextMessage":
        return [{
          chat_id: telegramChatId,
          text: header + messageData.extendedTextMessageData.text
        }];

      case "imageMessage":
        return [{
          chat_id: telegramChatId,
          photo: messageData.fileMessageData.downloadUrl,
          caption: header + messageData.fileMessageData.caption
        }];

      case "videoMessage":
        return [{
          chat_id: telegramChatId,
          video: messageData.fileMessageData.downloadUrl,
          caption: header + messageData.fileMessageData.caption
        }];
      
      case "audioMessage":
        return [{
          chat_id: telegramChatId,
          audio: messageData.fileMessageData.downloadUrl,
          caption: header + messageData.fileMessageData.caption
        }];

      case "documentMessage":
        return [{
          chat_id: telegramChatId,
          document: messageData.fileMessageData.downloadUrl,
          caption: header + messageData.fileMessageData.caption
        }];

      case "locationMessage":
        return [
          {
            chat_id: telegramChatId,
            text: header + "Сообщение содержит локацию. Она будет отправлена следующим сообщением."
          },
          {
            chat_id: telegramChatId,
            latitude: messageData.locationMessageData.latitude,
            longitude: messageData.locationMessageData.longitude
          }
        ];

      case "contactMessage":
        const contact = messageData.contactMessageData;
        const phoneNumber = this.extractPhoneNumberFromVcard(contact.vcard);
        return [
          {
            chat_id: telegramChatId,
            text: header + "Сообщение содержит контакт. Он будет отправлен следующим сообщением."
          },
          {
            chat_id: telegramChatId,
            phone_number: phoneNumber,
            first_name: contact.displayName,
          }
        ];

      case "pollMessage":
        return [
          {
            chat_id: telegramChatId,
            text: header + "Сообщение содержит опрос. Он будет отправлен следующим сообщением."
          },
          {
            chat_id: telegramChatId,
            question: messageData.pollMessageData.name,
            options: messageData.pollMessageData.options.map((opt: any) => opt.optionName)
          } as TelegramSendPoll
        ];

      default:
        throw new IntegrationError(
          `Unsupported message type: ${messageData.typeMessage}`,
          "UNSUPPORTED_MESSAGE_TYPE",
          400
        );
    }
  }

  private extractPhoneNumberFromVcard(vcard: string): string {
    
    try {
      const telLine = vcard.split('\n').find(line => line.startsWith('TEL'));
      if (!telLine) {
        return 'Номер не найден';
      }

      const telParts = telLine.split(':');
      if (telParts.length < 2) {
        return 'Номер не найден';
      }

      let phoneNumber = telParts[1].trim();
      
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      return phoneNumber;
    } catch (error) {
      console.error('Error extracting phone number from vcard:', error);
      return 'Ошибка извлечения номера';
    }
  }
}
