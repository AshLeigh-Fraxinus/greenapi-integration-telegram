import { TelegramBot } from "../../client/telegram.client";
import { SQLiteStorage } from "../../core/storage";

export class ReinstanceCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string): Promise<{ status: string }> {
    console.log("[COMMANDS.reInstance] Handling command")
    try {
      const instance = await this.storage.findInstanceByChatId(chatId);
      if (instance) {
        await this.storage.removeInstance(instance.id);
      }

      await this.bot.send({
        chat_id: chatId,
        text: "Привязка инстанса сброшена. Теперь вы можете привязать новый инстанс:\n\n" +
          "/instance 1101111111 abc123abc123abc123abc123abc123\n\n" +
          "Где:\n" +
          "• 1101111111 - idInstance\n" +
          "• abc123... - apiTokenInstance"
      });

      console.log("[COMMANDS.reInstance] Instance data cleared")

      return { status: "reinstance_handled" };

    } catch (error) {
      console.log("[COMMANDS.reInstance] Failed to handle reinstance command:", error);
      await this.bot.send({
        chat_id: chatId,
        text: "Ошибка при сбросе инстанса"
      });
      return { status: "error" };
    }
  }
}