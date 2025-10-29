import { TelegramBot } from "../../client/telegram.client";
import { SQLiteStorage } from "../../storage/storage";
import { Localization } from "../../utils/localization";

export class LanguageCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string): Promise<{ status: string }> {
    const args = messageText.split(' ').slice(1);
    const currentLanguage = await this.storage.getUserLanguage(chatId);
    
    if (args.length === 0) {
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getLanguageText(currentLanguage),
        parse_mode: 'HTML'
      });
      return { status: "current_language_shown" };
    }

    const language = args[0].toLowerCase();
    
    if (language !== 'ru' && language !== 'en') {
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('invalid_format', currentLanguage)
      });
      return { status: "invalid_language" };
    }

    await this.storage.setUserLanguage(chatId, language);
    
    await this.bot.send({
      chat_id: chatId,
      text: Localization.getLanguageChangedText(language)
    });

    return { status: "language_changed" };
  }
}