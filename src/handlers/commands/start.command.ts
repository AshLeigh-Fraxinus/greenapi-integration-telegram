import { TelegramBot } from "../../client/telegram.client";
import { SQLiteStorage } from "../../core/storage";

export class StartCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string, instance: any): Promise<{ status: string }> {
    console.log("[COMMANDS.start] Handling command")
    if (instance) {
      await this.bot.send({
        chat_id: chatId,
        text: "Бот уже настроен и готов к работе!\n\n" +
          "Отправляйте сообщения, и они будут пересылаться в WhatsApp.\n\n" +
          "Доступные команды:\n" +
          "• /status - статус инстанса\n" +
          "• /reinstance - сменить credentials\n" +
          "• /help - помощь"
      });
    } else {
      await this.bot.send({
        chat_id: chatId,
        text: "Добро пожаловать! Для начала работы необходимо привязать инстанс Green API.\n\n" +
          "Отправьте credentials в формате:\n" +
          "/instance 1101111111 abc123abc123abc123abc123abc123\n\n" +
          "Где:\n" +
          "• 1101111111 - idInstance\n" +
          "• abc123... - apiTokenInstance"
      });
    }
    console.log("[COMMANDS.start] Start message sent")
    return { status: "start_handled" };
  }
}