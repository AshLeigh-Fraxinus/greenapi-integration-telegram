import { TelegramBot } from "../../client/telegram.client";
import { SQLiteStorage } from "../../storage/storage";
import { Localization } from "../../utils/localization";

export class StartCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string, instance: any, language: string = 'en'): Promise<{ status: string }> {
    console.log("[COMMANDS.start] Handling command")
    
    if (instance) {
      const welcomeMsg = Localization.getMessage('welcome', language);
      const botReadyMsg = Localization.getMessage('bot_ready', language);
      const sendMessagesMsg = Localization.getMessage('send_messages', language);
      const useHelpMsg = Localization.getMessage('use_help', language);
      
      await this.bot.send({
        chat_id: chatId,
        text: `${welcomeMsg}\n\n${botReadyMsg}\n\n${sendMessagesMsg}\n\n${useHelpMsg}`
      });
    } else {
      const startText = Localization.getStartText(language);
      await this.bot.send({
        chat_id: chatId,
        text: startText,
        parse_mode: "HTML"
      });
    }
    console.log("[COMMANDS.start] Start message sent")
    return { status: "start_handled" };
  }
}