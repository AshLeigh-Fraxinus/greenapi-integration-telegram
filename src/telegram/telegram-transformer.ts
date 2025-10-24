
import { MessageTransformer, Message, GreenApiWebhook, IntegrationError } from "@green-api/greenapi-integration";
import { 
  TelegramWebhook, 
  TelegramPlatformMessage,
  TelegramSendMessage,
  TelegramSendPhoto,
  TelegramSendDocument,
  TelegramSendLocation,
  TelegramSendContact
} from "./telegram-types"

export class TelegramTransformer extends MessageTransformer<TelegramWebhook, TelegramPlatformMessage> {
  
  toPlatformMessage(webhook: GreenApiWebhook): TelegramPlatformMessage {
    try {
      if (webhook.typeWebhook === "incomingMessageReceived") {
        const chatId = webhook.senderData.sender;
        const messageData = webhook.messageData;
        console.log('Message type:', messageData.typeMessage)

        const sender = ('Новое сообщение WhatsApp:\n\nОтправитель: ' + webhook.senderData.senderName + '\nНомер: ' + webhook.senderData.sender);

        switch (messageData.typeMessage) {
          case "textMessage":
            return {
              chat_id: chatId,
              text: sender + messageData.textMessageData.textMessage
            } as TelegramSendMessage;

          case "extendedTextMessage":
            return {
              chat_id: chatId,
              text: sender + messageData.extendedTextMessageData.text
            } as TelegramSendMessage;

          case "imageMessage":
            return {
              chat_id: chatId,
              photo: messageData.fileMessageData.downloadUrl,
              caption: sender + messageData.fileMessageData.caption
            } as TelegramSendPhoto;

          case "documentMessage":
            return {
              chat_id: chatId,
              document: messageData.fileMessageData.downloadUrl,
              caption: sender + messageData.fileMessageData.caption
            } as TelegramSendDocument;

          case "locationMessage":
            return {
              chat_id: chatId,
              latitude: messageData.locationMessageData.latitude,
              longitude: messageData.locationMessageData.longitude
            } as TelegramSendLocation;

          case "contactMessage":
            const contact = messageData.contactMessageData;
            return {
              chat_id: chatId,
              phone_number: contact.vcard,
              first_name: contact.displayName,
            } as TelegramSendContact;

          default:
            throw new IntegrationError(
              `Unsupported message type: ${messageData.typeMessage}`,
              "UNSUPPORTED_MESSAGE_TYPE",
              400
            );
        }
      }

      throw new IntegrationError(
        `Unsupported webhook type: ${webhook.typeWebhook}`,
        "UNSUPPORTED_WEBHOOK_TYPE",
        400
      );
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }
      throw new IntegrationError(
        `Failed to transform GREEN-API webhook to Telegram format: ${error}`,
        "TRANSFORMATION_ERROR",
        500
      );
    }
  }

  toGreenApiMessage(telegramWebhook: TelegramWebhook): Message {
    try {
      const message = telegramWebhook.message || telegramWebhook.edited_message;
      if (!message) {
        throw new IntegrationError("No message found in Telegram webhook", "INVALID_WEBHOOK", 400);
      }

      const telegramChatId = message.chat.id.toString();

      const placeholderChatId = telegramChatId;

      if (message.text) {
        return {
          type: "text",
          chatId: placeholderChatId,
          message: message.text
        };
      }

      if (message.photo && message.photo.length > 0) {
        const photo = message.photo[message.photo.length - 1];
        return {
          type: "url-file",
          chatId: placeholderChatId,
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
          chatId: placeholderChatId,
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
          chatId: placeholderChatId,
          latitude: message.location.latitude,
          longitude: message.location.longitude
        };
      }

      if (message.contact) {
        return {
          type: "contact",
          chatId: placeholderChatId,
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
