import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { Localization } from "../../../utils/localization";

export class ChangeInstanceCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string, language: string = 'en'): Promise<{ status: string }> {
    console.log("[COMMANDS.resetInstance] Handling command")
    try {
      const instance = await this.storage.findInstanceByChatId(chatId);
      if (instance) {
        await this.storage.removeInstance(instance.idInstance);
      }

      const message = language === 'ru' || language === 'kz' ? 
        "Привязка инстанса сброшена. Теперь вы можете привязать новый инстанс:\n\n" +
        "/instance 1101111111 abc123abc123abc123abc123abc123\n\n" +
        "Где:\n" +
        "• 1101111111 - idInstance\n" +
        "• abc123... - apiTokenInstance" :
        "Instance binding reset. Now you can link a new instance:\n\n" +
        "/instance 1101111111 abc123abc123abc123abc123abc123\n\n" +
        "Where:\n" +
        "• 1101111111 - idInstance\n" +
        "• abc123... - apiTokenInstance";

      await this.bot.send({
        chat_id: chatId,
        text: message
      });

      console.log("[COMMANDS.change-Instance] Instance data change-Instanceed")
      return { status: "change-Instance_handled" };

    } catch (error) {
      console.log("[COMMANDS.change-Instance] Failed to handle change-Instance command:", error);
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('error_reset_instance', language)
      });
      return { status: "error" };
    }
  }
}