import { TelegramBot } from "../../client/telegram.client";
import { SQLiteStorage } from "../../core/storage";

export class InstanceCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string): Promise<{ status: string }> {
    console.log("[COMMANDS.instance] Handling command")
    try {
      const parts = messageText.split(' ');
      if (parts.length !== 3) {
        console.log("[COMMANDS.instance] Incorrect message format")
        await this.bot.send({
          chat_id: chatId,
          text: "Неверный формат. Используйте:\n" +
            "/instance 1101111111 abc123abc123abc123abc123abc123\n\n" +
            "Где:\n" +
            "• 1101111111 - idInstance\n" +
            "• abc123... - apiTokenInstance"
        });
        return { status: "invalid_format" };
      }

      const idInstance = parts[1];
      const apiToken = parts[2];

      const idInstanceNumber = Number(idInstance);
      const user = await this.storage.findUser(chatId);
      const userName = user?.user_name || `user_${chatId}`;

      await this.storage.createInstance({
        idInstance: idInstanceNumber,
        apiTokenInstance: apiToken,
        name: userName,
        token: apiToken,
        settings: {
          chatId: chatId
        }
      }, 0);

      console.log('[COMMANDS.instance] Created/updated instance for user:', { chatId, idInstance: idInstanceNumber });

      await this.bot.send({
        chat_id: chatId,
        text: "Инстанс успешно привязан!\n\n" +
          "Теперь вы можете получать и отправлять сообщения через WhatsApp.\n\n" +
          "Доступные команды:\n" +
          "• /status - статус инстанса\n" +
          "• /reinstance - сменить credentials\n" +
          "• /help - помощь"
      });

      console.log("[COMMANDS.instance] Instance saved")
      return { status: "instance_created" };

    } catch (error) {
      console.log("[COMMANDS.instance] Failed to handle instance command:", error);
      
      if (error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        await this.bot.send({
          chat_id: chatId,
          text: "Этот инстанс уже привязан к другому пользователю Telegram.\n\n" +
            "Используйте другой idInstance или обратитесь к администратору."
        });
      } else {
        await this.bot.send({
          chat_id: chatId,
          text: "Произошла ошибка при привязке инстанса"
        });
      }
      
      return { status: "error" };
    }
  }
}