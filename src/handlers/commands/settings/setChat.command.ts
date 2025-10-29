import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { Localization } from "../../../utils/localization";

export class SetChatCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string, language: string = 'en'): Promise<{ status: string }> {
    try {
      const params = messageText.split(' ').slice(1);

      if (params.length === 0) {
        const message = language === 'ru' || language === 'kz' ? 
          "Укажите chat_id для пересылки сообщений\n\n" +
          "Пример:\n" +
          "/setchat -1234567890\n" +
          "/setchat @username" :
          "Specify chat_id for message forwarding\n\n" +
          "Example:\n" +
          "/setchat -1234567890\n" +
          "/setchat @username";
        
        await this.bot.send({
          chat_id: chatId,
          text: message
        });
        return { status: "invalid_format" };
      }

      const targetChatId = params[0];
      
      if (!this.isValidChatId(targetChatId)) {
        const message = language === 'ru' || language === 'kz' ? 
          "Неверный формат chat_id\n\n" +
          "Chat_id может быть:\n" +
          "• Числом: -1001234567890\n" + 
          "• Юзернейм: @username\n" +
          "• Ваш личный ID (можно узнать через /me)" :
          "Invalid chat_id format\n\n" +
          "Chat_id can be:\n" +
          "• Number: -1001234567890\n" + 
          "• Username: @username\n" +
          "• Your personal ID (can be found via /me)";
        
        await this.bot.send({
          chat_id: chatId,
          text: message
        });
        return { status: "invalid_chat_id" };
      }

      await this.storage.setTargetChatId(chatId, targetChatId);
      
      const message = language === 'ru' || language === 'kz' ? 
        "Настройки обновлены!\n\n" +
        "Все сообщения из WhatsApp теперь будут пересылаться в:\n" +
        `<code>${targetChatId}</code>\n\n` +
        "Чтобы сбросить настройку и получать сообщения себе:\n" +
        "/resetchat" :
        "Settings updated!\n\n" +
        "All WhatsApp messages will now be forwarded to:\n" +
        `<code>${targetChatId}</code>\n\n` +
        "To reset settings and receive messages yourself:\n" +
        "/resetchat";
      
      await this.bot.send({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });

      return { status: "target_set" };
    } catch (error) {
      console.log("[COMMANDS.set_chat] Failed to set target chat:", error);
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('error_set_chat', language)
      });
      return { status: "error" };
    }
  }

  private isValidChatId(chatId: string): boolean {
    return /^(-?\d+)$/.test(chatId) || /^@[a-zA-Z0-9_]+$/.test(chatId);
  }
}