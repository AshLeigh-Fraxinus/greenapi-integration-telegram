import { TelegramBot } from "../../client/telegram.client";

export class HelpCommand {
  constructor(private bot: TelegramBot) {}

  async execute(chatId: string): Promise<{ status: string }> {
    console.log("[COMMANDS.help] Handling command")
    await this.bot.send({
      chat_id: chatId,
      text: "**Доступные команды:**\n\n" +
        "Сервисные команды:\n" +
        "• `/start` - начать работу\n" +
        "• `/instance` <id> <token> - привязать инстанс Green API\n" +
        "• `/status` - проверить статус инстанса\n" +
        "• `/reinstance` - сменить привязанный инстанс\n" +
        "После привязки инстанса сообщения, полученные в WhatsApp, будут отправляться сюда.\n\n" +
        "Команды WhatsApp:\n" +
        "• `/reply` <chatId> <message> - отправить сообщение в WhatsApp\n",
      parse_mode: "Markdown"
    });
    console.log("[COMMANDS.help] Help message sent")
    return { status: "help_shown" };
  }
}