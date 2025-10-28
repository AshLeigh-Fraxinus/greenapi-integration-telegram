import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";

export class ResetChatCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string): Promise<{ status: string }> {
    try {
      await this.storage.resetTargetChatId(chatId);
      
      await this.bot.send({
        chat_id: chatId,
        text: "Настройки сброшены!\n\n" +
              "Сообщения из WhatsApp теперь приходят вам.\n\n" +
              "Чтобы настроить пересылку в другой чат:\n" +
              "/setchat &lt;chat_id&gt;",  
        parse_mode: 'HTML'
      });

      return { status: "target_reset" };
    } catch (error) {
      console.log("[COMMANDS.reset_chat] Failed to reset target chat:", error);
      await this.bot.send({
        chat_id: chatId,
        text: "Ошибка при сбросе настроек пересылки"
      });
      return { status: "error" };
    }
  }
}