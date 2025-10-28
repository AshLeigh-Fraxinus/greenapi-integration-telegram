import { GreenApiClient } from "@green-api/greenapi-integration";
import { TelegramBot } from "../../../client/telegram.client";

export class SendMessage {
  constructor(
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string, instance: any): Promise<{ status: string; messageId?: string }> {
    console.log("[COMMANDS.reply] Handling command")
    try {
      if (!instance) {
        await this.bot.send({
          chat_id: chatId,
          text: "Инстанс не привязан. Используйте /instance для привязки."
        });
        console.log("[COMMANDS.reply] No connected Instance for user")
        return { status: "no_instance" };
      }

      const replyContent = messageText.replace(/^\/(reply|sendMessage)\s/, '').trim();
      
      const firstSpaceIndex = replyContent.indexOf(' ');
      if (firstSpaceIndex === -1) {
        await this.bot.send({
          chat_id: chatId,
          text: "Неверный формат. Используйте:\n" +
            "<code>/reply &lt;chatId&gt; &lt;message&gt;</code>\n\n" +
            "Например:\n" +
            "/reply 1234567890@c.us Привет!"
        });
        console.log("[COMMANDS.reply] Invalid message format")
        return { status: "invalid_format" };
      }

      let whatsappChatId = replyContent.substring(0, firstSpaceIndex);
      const message = replyContent.substring(firstSpaceIndex + 1);

      if (!whatsappChatId || !message) {
        await this.bot.send({
          chat_id: chatId,
          text: "ChatId и сообщение не могут быть пустыми"
        });
        console.log("[COMMANDS.reply] No chatId. Message won't be sent")
        return { status: "invalid_content" };
      }

      if (!whatsappChatId.includes('@')) {
        whatsappChatId += '@c.us';
      }

      const greenApiClient = new GreenApiClient(instance);
      const sendMessageResponse = await greenApiClient.sendMessage({
        chatId: whatsappChatId,
        message: message,
        type: "text"
      });
      const messageId = sendMessageResponse.idMessage;
      console.log('[COMMANDS.reply] Message', messageId, '{', message, '}', 'sent to', whatsappChatId);

      await this.bot.send({
        chat_id: chatId,
        text: `Сообщение отправлено в WhatsApp:\n\n` +
          `Чат: ${whatsappChatId}\n` +
          `Текст: ${message}\n` +
          `ID сообщения: ${messageId}`
      });

      return { status: "message_sent", messageId: messageId };

    } catch (error) {
      console.log("[COMMANDS.reply] Failed to handle reply command:", error);
      await this.bot.send({
        chat_id: chatId,
        text: "Ошибка при отправке сообщения: " + (error || "Unknown error")
      });
      return { status: "error" };
    }
  }
}