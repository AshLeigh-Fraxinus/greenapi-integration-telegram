import { GreenApiClient } from "@green-api/greenapi-integration";
import { TelegramBot } from "../../../client/telegram.client";
import { Localization } from "../../../utils/localization";

export class SendMessage {
  constructor(
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string, instance: any, language: string = 'en'): Promise<{ status: string; messageId?: string }> {
    console.log("[COMMANDS.reply] Handling command")
    try {
      if (!instance) {
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getMessage('no_instance', language) + " " + Localization.getMessage('use_help', language)
        });
        console.log("[COMMANDS.reply] No connected Instance for user")
        return { status: "no_instance" };
      }

      const replyContent = messageText.replace(/^\/(reply|sendMessage)\s/, '').trim();
      
      const firstSpaceIndex = replyContent.indexOf(' ');
      if (firstSpaceIndex === -1) {
        const message = language === 'ru' || language === 'kz' ? 
          "Неверный формат. Используйте:\n" +
          "<code>/reply &lt;номер_телефона&gt; &lt;сообщение&gt;</code>\n\n" +
          "Например:\n" +
          "/reply +77073319453 Привет!\n" +
          "/reply 77073319453 Привет!" :
          "Invalid format. Use:\n" +
          "<code>/reply &lt;phone_number&gt; &lt;message&gt;</code>\n\n" +
          "For example:\n" +
          "/reply +77073319453 Hello!\n" +
          "/reply 77073319453 Hello!";

        await this.bot.send({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        });
        console.log("[COMMANDS.reply] Invalid message format")
        return { status: "invalid_format" };
      }

      let whatsappChatId = replyContent.substring(0, firstSpaceIndex);
      const message = replyContent.substring(firstSpaceIndex + 1);

      if (!whatsappChatId || !message) {
        const errorText = language === 'ru' || language === 'kz' ? 
          "Номер телефона и сообщение не могут быть пустыми" :
          "Phone number and message cannot be empty";

        await this.bot.send({
          chat_id: chatId,
          text: errorText
        });
        console.log("[COMMANDS.reply] No chatId. Message won't be sent")
        return { status: "invalid_content" };
      }
      
      const cleanPhoneNumber = whatsappChatId.replace(/\D/g, '');
      
      whatsappChatId = `${cleanPhoneNumber}@c.us`;

      const greenApiClient = new GreenApiClient(instance);
      const sendMessageResponse = await greenApiClient.sendMessage({
        chatId: whatsappChatId,
        message: message,
        type: "text"
      });
      const messageId = sendMessageResponse.idMessage;
      console.log('[COMMANDS.reply] Message', messageId, '{', message, '}', 'sent to', whatsappChatId);

      const successMessage = language === 'ru' || language === 'kz' ? 
        `Сообщение отправлено в WhatsApp:\n\n` +
        `Чат: ${whatsappChatId}\n` +
        `Текст: ${message}\n` +
        `ID сообщения: ${messageId}` :
        `Message sent to WhatsApp:\n\n` +
        `Chat: ${whatsappChatId}\n` +
        `Text: ${message}\n` +
        `Message ID: ${messageId}`;

      await this.bot.send({
        chat_id: chatId,
        text: successMessage
      });

      return { status: "message_sent", messageId: messageId };

    } catch (error) {
      console.log("[COMMANDS.reply] Failed to handle reply command:", error);
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('error_sending_message', language) + ": " + (error || "Unknown error")
      });
      return { status: "error" };
    }
  }
}