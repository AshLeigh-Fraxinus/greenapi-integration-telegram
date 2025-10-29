import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { Localization } from "../../../utils/localization";

export class SetPartnerTokenCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}
  
  async execute(messageText: string, chatId: string, language: string = 'en'): Promise<{ status: string; error?: string }> {
    try {
      const token = messageText.split(' ')[1];
      if (!token) {
        const message = language === 'ru' || language === 'kz' ? 
          "Пожалуйста, укажите partner token.\n\nДля этого отправьте команду: <code>/setpartnertoken &lt;token&gt;</code>" :
          "Please specify partner token.\n\nSend command: <code>/setpartnertoken &lt;token&gt;</code>";
        
        await this.bot.send({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        });
        return { status: "missing_token" };
      }

      await this.storage.setPartnerToken(chatId, token);
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('partner_token_saved', language)
      });
      return { status: "partner_token_saved" };

    } catch (error) {
      console.error("[HANDLER] Failed to set partner token:", error);
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('error_saving_token', language)
      });
      return { status: "error", error: "Failed to set partner token" };
    }
  }
}