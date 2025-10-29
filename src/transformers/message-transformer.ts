import { MessageWebhook, IntegrationError, GreenApiWebhook } from "@green-api/greenapi-integration";
import { TelegramPlatformMessage } from "../types/telegram";
import { BaseTransformer } from "./base-transformer";
import { SQLiteStorage } from "../storage/storage";

export class MessageTransformer extends BaseTransformer {
  constructor(storage: SQLiteStorage) {
    super(storage);
  }

  private formatSenderInfo(webhook: MessageWebhook, language: string = 'en'): string {
    const senderData = webhook.senderData;
    if (!senderData) return "";
    
    const senderName = senderData.senderName || senderData.chatName || 
      (language === 'ru' || language === 'kz' ? "Неизвестно" : "Unknown");
    const senderNumber = senderData.sender || senderData.chatId || 
      (language === 'ru' || language === 'kz' ? "Неизвестно" : "Unknown");
    
    if (String(senderData.chatId).endsWith('@g.us')) {
      const chatName = senderData.chatName || 
        (language === 'ru' || language === 'kz' ? "Групповой чат" : "Group Chat");
      
      if (language === 'ru' || language === 'kz') {
        return `• Отправитель: ${senderName}\n• Номер: ${senderNumber}\n• Группа: ${chatName}\n\n• Получатель: Instance ${webhook.instanceData.idInstance}`;
      } else {
        return `• Sender: ${senderName}\n• Number: ${senderNumber}\n• Group: ${chatName}\n\n• Recipient: Instance ${webhook.instanceData.idInstance}`;
      }
    } else {
      if (language === 'ru' || language === 'kz') {
        return `• Отправитель: ${senderName}\n• Номер: ${senderNumber}\n\n• Получатель: Instance ${webhook.instanceData.idInstance}`;
      } else {
        return `• Sender: ${senderName}\n• Number: ${senderNumber}\n\n• Recipient: Instance ${webhook.instanceData.idInstance}`;
      }
    }
  }

  private getHeader(webhook: MessageWebhook, language: string = 'en'): string {
    const headerText = language === 'ru' || language === 'kz' ? 
      "Новое сообщение WhatsApp:\n\n" : 
      "New WhatsApp message:\n\n";
    
    return headerText + this.formatSenderInfo(webhook, language) + "\n⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭\n\n";
  }

  handleIncomingMessage(webhook: MessageWebhook, language: string = 'en'): TelegramPlatformMessage {
    const header = this.getHeader(webhook, language);
    const messageData = webhook.messageData;
    console.log("[TRANSFORMER] WhatsApp message has type", messageData.typeMessage)

    switch (messageData.typeMessage) {
      case "textMessage":
        return {
          chat_id: "", 
          text: header + messageData.textMessageData.textMessage
        };
      
      case "extendedTextMessage":
        return {
          chat_id: "",
          text: header + messageData.extendedTextMessageData.text
        };
      
      case "imageMessage":
        return {
          chat_id: "",
          photo: messageData.fileMessageData.downloadUrl,
          caption: header + (messageData.fileMessageData.caption || '')
        };
      
      case "videoMessage":
        return {
          chat_id: "",
          video: messageData.fileMessageData.downloadUrl,
          caption: header + (messageData.fileMessageData.caption || '')
        };
      
      case "audioMessage":
        return {
          chat_id: "",
          audio: messageData.fileMessageData.downloadUrl,
          caption: header + (messageData.fileMessageData.caption || '')
        };
      
      case "documentMessage":
        return {
          chat_id: "",
          document: messageData.fileMessageData.downloadUrl,
          caption: header + (messageData.fileMessageData.caption || '')
        };
      
      case "locationMessage":
        const locationText = language === 'ru' || language === 'kz' ? 
          "Сообщение содержит локацию. Она будет отправлена следующим сообщением." :
          "Message contains location. It will be sent in the next message.";
        return {
          chat_id: "",
          text: header + locationText
        };
      
      case "contactMessage":
        const contactText = language === 'ru' || language === 'kz' ? 
          "Сообщение содержит контакт. Он будет отправлен следующим сообщением." :
          "Message contains contact. It will be sent in the next message.";
        return {
          chat_id: "",
          text: header + contactText
        };
      
      case "pollMessage":
        const pollText = language === 'ru' || language === 'kz' ? 
          "Сообщение содержит опрос. Он будет отправлен следующим сообщением." :
          "Message contains poll. It will be sent in the next message.";
        return {
          chat_id: "",
          text: header + pollText
        };
      
      default:
        throw new IntegrationError(
          `Unsupported message type: ${messageData.typeMessage}`,
          "UNSUPPORTED_MESSAGE_TYPE",
          400
        );
    }
  }

  getAdditionalMessages(webhook: GreenApiWebhook, language: string = 'en'): TelegramPlatformMessage[] {
    if (webhook.typeWebhook !== "incomingMessageReceived") {
      return [];
    }

    const incomingWebhook = webhook as MessageWebhook;
    const messageData = incomingWebhook.messageData;
    const additionalMessages: TelegramPlatformMessage[] = [];

    switch (messageData.typeMessage) {
      case "locationMessage":
        additionalMessages.push({
          chat_id: "",
          latitude: messageData.locationMessageData.latitude,
          longitude: messageData.locationMessageData.longitude
        });
        break;
      
      case "contactMessage":
        const contact = messageData.contactMessageData;
        const phoneNumber = this.extractPhoneNumber(contact.vcard, language);
        
        additionalMessages.push({
          chat_id: "",
          phone_number: phoneNumber,
          first_name: contact.displayName,
        });
        break;
      
      case "pollMessage":
        additionalMessages.push({
          chat_id: "",
          question: messageData.pollMessageData.name,
          options: messageData.pollMessageData.options.map((opt: any) => opt.optionName)
        });
        break;
    }

    return additionalMessages;
  }
}