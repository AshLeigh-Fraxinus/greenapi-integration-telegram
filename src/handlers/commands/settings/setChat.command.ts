import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";

export class SetChatCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string): Promise<{ status: string }> {
    try {
      const params = messageText.split(' ').slice(1);

      if (params.length === 0) {
        await this.bot.send({
          chat_id: chatId,
          text: "Укажите chat_id для пересылки сообщений\n\n" +
                "Пример:\n" +
                "/setchat -1234567890\n" +
                "/setchat @username"
        });
        return { status: "invalid_format" };
      }

      const targetChatId = params[0];
      
      if (!this.isValidChatId(targetChatId)) {
        await this.bot.send({
          chat_id: chatId,
          text: "Неверный формат chat_id\n\n" +
                "Chat_id может быть:\n" +
                "• Числом: -1001234567890\n" + 
                "• Юзернейм: @username\n" +
                "• Ваш личный ID (можно узнать через /me)"
        });
        return { status: "invalid_chat_id" };
      }

      await this.storage.setTargetChatId(chatId, targetChatId);
      
      await this.bot.send({
        chat_id: chatId,
        text: "Настройки обновлены!\n\n" +
              "Все сообщения из WhatsApp теперь будут пересылаться в:\n" +
              `<code>${targetChatId}</code>\n\n` +
              "Чтобы сбросить настройку и получать сообщения себе:\n" +
              "/resetchat",
        parse_mode: 'HTML'
      });

      return { status: "target_set" };
    } catch (error) {
      console.log("[COMMANDS.set_chat] Failed to set target chat:", error);
      await this.bot.send({
        chat_id: chatId,
        text: "Ошибка при настройке пересылки"
      });
      return { status: "error" };
    }
  }

  private isValidChatId(chatId: string): boolean {
    return /^(-?\d+)$/.test(chatId) || /^@[a-zA-Z0-9_]+$/.test(chatId);
  }
}