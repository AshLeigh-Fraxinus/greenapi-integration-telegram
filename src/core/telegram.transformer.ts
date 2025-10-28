import { 
  Message, 
  MessageWebhook,
  GreenApiWebhook, 
  IntegrationError,
  MessageTransformer,
  StateInstanceWebhook,
  OutgoingMessageStatusWebhook,
} from "@green-api/greenapi-integration";
import { SQLiteStorage } from "./storage";
import { TelegramWebhook, TelegramPlatformMessage } from "../types/types"

export class TelegramTransformer extends MessageTransformer<TelegramWebhook, TelegramPlatformMessage> {
  
  public constructor(
    private storage: SQLiteStorage
  ) {
    super();
  }

  private formatSenderInfo(webhook: MessageWebhook): string {
    const senderData = webhook.senderData;
    if (!senderData) return "";
    
    const senderName = senderData.senderName || senderData.chatName || "Unknown";
    const senderNumber = senderData.sender || senderData.chatId || "Unknown";
    
    if (String(senderData.chatId).endsWith('@g.us')) {
      const chatName = senderData.chatName || "Group Chat";
      return `• Отправитель: ${senderName}\n• Номер: ${senderNumber}\n• Группа: ${chatName}\n\n• Получатель: Instance ${webhook.instanceData.idInstance}`;
    } else {
      return `• Отправитель: ${senderName}\n• Номер: ${senderNumber}\n\n• Получатель: Instance ${webhook.instanceData.idInstance}`;
    }
  }

  private getHeader(webhook: MessageWebhook): string {
    return `Новое сообщение WhatsApp:\n\n${this.formatSenderInfo(webhook)}\n⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭ ⸭\n\n`;
  }

  private extractPhoneNumber(vcard: string): string {
    if (!vcard) return 'Номер не найден';
    
    try {
      const telLine = vcard.split('\n').find(line => line.startsWith('TEL'));
      if (!telLine) return 'Номер не найден';

      const telParts = telLine.split(':');
      if (telParts.length < 2) return 'Номер не найден';

      let phoneNumber = telParts[1].trim();
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      return phoneNumber || 'Номер не найден';
    } catch (error) {
      console.error('Error extracting phone number from vcard:', error);
      return 'Ошибка извлечения номера';
    }
  }

  toPlatformMessage(webhook: GreenApiWebhook): TelegramPlatformMessage {
    switch (webhook.typeWebhook) {
      case "incomingMessageReceived":
        return this.handleIncomingMessage(webhook as MessageWebhook);
      
      case "outgoingMessageStatus":
        return this.handleOutgoingMessageStatus(webhook as OutgoingMessageStatusWebhook);
      
      case "stateInstanceChanged":
        return this.handleStateInstanceChanged(webhook as StateInstanceWebhook);
      
      default:
        throw new IntegrationError(
          `Unsupported webhook type: ${webhook.typeWebhook}`,
          "UNSUPPORTED_WEBHOOK_TYPE",
          400
        );
    }
  }

  private handleIncomingMessage(webhook: MessageWebhook): TelegramPlatformMessage {
    const header = this.getHeader(webhook);
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
        return {
          chat_id: "",
          text: header + "Сообщение содержит локацию. Она будет отправлена следующим сообщением."
        };
      
      case "contactMessage":
        return {
          chat_id: "",
          text: header + "Сообщение содержит контакт. Он будет отправлен следующим сообщением."
        };
      
      case "pollMessage":
        return {
          chat_id: "",
          text: header + "Сообщение содержит опрос. Он будет отправлен следующим сообщением."
        };
      
      default:
        throw new IntegrationError(
          `Unsupported message type: ${messageData.typeMessage}`,
          "UNSUPPORTED_MESSAGE_TYPE",
          400
        );
    }
  }

  private handleOutgoingMessageStatus(webhook: OutgoingMessageStatusWebhook): TelegramPlatformMessage {
    const statusMap: { [key: string]: string } = {
      sent: "отправлено",
      delivered: "доставлено", 
      read: "прочитано",
      failed: "ошибка отправки"
    };

    const status = statusMap[webhook.status] || webhook.status;
    
    return {
      chat_id: "",
      text: `Статус сообщения: ${status}\nID сообщения: ${webhook.idMessage}`
    };
  }

  private handleStateInstanceChanged(webhook: StateInstanceWebhook): TelegramPlatformMessage {
    return {
      chat_id: "",
      text: `Изменение статуса инстанса ${webhook.instanceData.idInstance}: ${webhook.stateInstance}`,
      parse_mode: 'HTML'
    };
  }

  async handleStateInstanceChangedWithUser(webhook: StateInstanceWebhook): Promise<TelegramPlatformMessage> {
    const user = await this.storage.findUserByInstanceId(webhook.instanceData.idInstance);

    if (!user) {
      return {
        chat_id: "",
        text: `Ошибка: пользователь для инстанса ${webhook.instanceData.idInstance} не найден`,
        parse_mode: 'HTML'
      };
    }

    const apiTokenInstance = user.apiTokenInstance;

    const stateMap: { [key: string]: string } = {
      authorized: "<code>authorized</code>\n\nИнстанс авторизован и готов к работе",
      notAuthorized: "<code>notAuthorized</code>\n\nИнстанс не авторизован.\n" +
      "Для авторизации инстанса перейдите по ссылке:\n" +
      "https://qr.green-api.com/waInstance" + webhook.instanceData.idInstance + "/" + apiTokenInstance,
      blocked: "<code>blocked</code>",
      starting: "<code>starting</code>\n\nИнстанс в процессе запуска (сервисный режим).\n" +
      "Происходит перезагрузка инстанса, сервера или инстанс в режиме обслуживания. " +
      "Может потребоваться до 5 минут для перехода состояния инстанса в значение <code>authorized</code>"
    };

    const state = stateMap[webhook.stateInstance] || webhook.stateInstance;
    
    return {
      chat_id: "",
      text: `<b>Изменение статуса инстанса ${webhook.instanceData.idInstance}</b>: ${state}`,
      parse_mode: 'HTML'
    };
  }

  getAdditionalMessages(webhook: GreenApiWebhook): TelegramPlatformMessage[] {
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
        const phoneNumber = this.extractPhoneNumber(contact.vcard);
        
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