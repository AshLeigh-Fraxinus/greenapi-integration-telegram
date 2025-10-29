import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { Localization } from "../../../utils/localization";

export class ResetChatCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string, language: string = 'en'): Promise<{ status: string }> {
    try {
      await this.storage.resetTargetChatId(chatId);
      
      const message = language === 'ru' || language === 'kz' ? 
        "Настройки сброшены!\n\n" +
        "Сообщения из WhatsApp теперь приходят вам.\n\n" +
        "Чтобы настроить пересылку в другой чат:\n" +
        "/setchat &lt;chat_id&gt;" :
        "Settings reset!\n\n" +
        "WhatsApp messages now come to you.\n\n" +
        "To configure forwarding to another chat:\n" +
        "/setchat &lt;chat_id&gt;";
      
      await this.bot.send({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });

      return { status: "target_reset" };
    } catch (error) {
      console.log("[COMMANDS.reset_chat] Failed to reset target chat:", error);
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('error_reset_chat', language)
      });
      return { status: "error" };
    }
  }
}