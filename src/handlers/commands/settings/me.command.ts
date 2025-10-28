import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";

export class MeCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string): Promise<{ status: string }> {
    try {
      const user = await this.storage.findUser(chatId);
      if (!user) {
        await this.bot.send({
          chat_id: chatId,
          text: "Пользователь не найден"
        });
        return { status: "user_not_found" };
      }

      const targetChatId = await this.storage.getTargetChatId(chatId);
      
      await this.bot.send({
        chat_id: chatId,
        text: "<b>Ваша информация</b>\n\n" +
              `<b>Ваш Telegram ID:</b> <code>${chatId}</code>\n` +
              `<b>Username:</b> ${user.user_name || 'не указан'}\n` +
              `<b>Имя:</b> ${user.first_name || 'не указано'}\n\n` +
              `<b>Пересылка сообщений:</b>\n` +
              (targetChatId 
                ? `В чат <code>${targetChatId}</code>`
                : `В этот чат`),
        parse_mode: 'HTML'
      });

      return { status: "info_shown" };
    } catch (error) {
      console.log("[COMMANDS.me] Failed to handle me command:", error);
      await this.bot.send({
        chat_id: chatId,
        text: "Ошибка при получении информации"
      });
      return { status: "error" };
    }
  }
}