import { TelegramBot } from "../../client/telegram.client";
import { SQLiteStorage } from "../../storage/storage";
import { Localization } from "../../utils/localization";

export class MeCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string, language: string = 'en'): Promise<{ status: string }> {
    try {
      const user = await this.storage.findUser(chatId);
      if (!user) {
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getMessage('user_not_found', language)
        });
        return { status: "user_not_found" };
      }

      const targetChatId = await this.storage.getTargetChatId(chatId);
      
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMeText(language, user, targetChatId || undefined),
        parse_mode: 'HTML'
      });

      return { status: "info_shown" };
    } catch (error) {
      console.log("[COMMANDS.me] Failed to handle me command:", error);
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('error_getting_info', language)
      });
      return { status: "error" };
    }
  }
}