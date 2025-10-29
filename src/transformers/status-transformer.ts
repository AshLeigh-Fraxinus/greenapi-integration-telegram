import { OutgoingMessageStatusWebhook } from "@green-api/greenapi-integration";
import { TelegramPlatformMessage } from "../types/telegram";
import { BaseTransformer } from "./base-transformer";
import { SQLiteStorage } from "../storage/storage";

export class StatusTransformer extends BaseTransformer {
  constructor(storage: SQLiteStorage) {
    super(storage);
  }

  handleOutgoingMessageStatus(webhook: OutgoingMessageStatusWebhook, language: string = 'en'): TelegramPlatformMessage {
    // Обработка статуса noAccount
    if (webhook.status === 'noAccount') {
      const messageText = language === 'ru' || language === 'kz' ? 
        `❌ Ошибка отправки сообщения\n\n` +
        `Статус: <b>noAccount</b>\n` +
        `ID сообщения: ${webhook.idMessage}\n` +
        `Получатель: ${webhook.chatId}\n\n` +
        `<b>Возможные причины:</b>\n` +
        `• Номер телефона должен быть в международном формате\n(например, 79876543210 вместо +79876543210 или 89876543210)\n` +
        `• Некорректный номер телефона\n` +
        `• Номер не зарегистрирован в WhatsApp\n\n` +
        `📚 <a href="https://green-api.com/docs/faq/features-of-sending-and-receiving-messages-from-different-countries/">Особенности отправки и получения сообщений в разных странах</a>` :
        `❌ Message sending error\n\n` +
        `Status: <b>noAccount</b>\n` +
        `Message ID: ${webhook.idMessage}\n` +
        `Recipient: ${webhook.chatId}\n\n` +
        `<b>Possible reasons:</b>\n` +
        `• Phone number must be in international format\n(e.g., 79876543210 instead of +79876543210 or 89876543210)\n` +
        `• Invalid phone number\n` +
        `• Number is not registered in WhatsApp\n\n` +
        `📚 <a href="https://green-api.com/docs/faq/features-of-sending-and-receiving-messages-from-different-countries/">Features of sending and receiving messages from different countries</a>`;
      
      return {
        chat_id: "",
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      };
    }

    const statusMapRu: { [key: string]: string } = {
      sent: "отправлено",
      delivered: "доставлено", 
      read: "прочитано",
      failed: "ошибка отправки"
    };

    const statusMapEn: { [key: string]: string } = {
      sent: "sent",
      delivered: "delivered", 
      read: "read",
      failed: "failed"
    };

    const statusMap = language === 'ru' || language === 'kz' ? statusMapRu : statusMapEn;
    const status = statusMap[webhook.status] || webhook.status;

    const messageText = language === 'ru' || language === 'kz' ? 
      `Статус сообщения: ${status}\nID сообщения: ${webhook.idMessage}` :
      `Message status: ${status}\nMessage ID: ${webhook.idMessage}`;
    
    return {
      chat_id: "",
      text: messageText
    };
  }
}