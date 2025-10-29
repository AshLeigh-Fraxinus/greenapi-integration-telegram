import { TelegramBot } from "../../client/telegram.client";
import { Localization } from "../../utils/localization";

export class HelpCommand {
  constructor(private bot: TelegramBot) {}

  async execute(chatId: string, language: string = 'en'): Promise<{ status: string }> {
    console.log("[COMMANDS.help] Handling command")
    
    const helpText = Localization.getHelpText(language);
    
    await this.bot.send({
      chat_id: chatId,
      text: helpText,
      parse_mode: "HTML"
    });
    console.log("[COMMANDS.help] Help message sent")
    return { status: "help_shown" };
  }
}