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
        text: "Бот настроен и готов к работе!\n\n" +
          "Отправляйте сообщения, и они будут пересылаться в WhatsApp.\n\n" +
          "Для получения списка доступных команд отправьте /help"
      });
    } else {
      await this.bot.send({
        chat_id: chatId,
        text: "<b>Добро пожаловать в WhatsApp-мост!</b>\n\n" +
          "<b>Пошаговая инструкция для начала работы:</b>\n\n" +
          
          "1️. <b>Получите инстанс в Green API</b>\n" +
          "   • Зарегистрируйтесь на console.green-api.com\n" +
          "   • Создайте инстанс в личном кабинете\n" +
          "   • Скопируйте idInstance и apiTokenInstance\n\n" +
          
          "2. <b>Настройте WhatsApp</b>\n" +
          "   • Откройте привязанный инстанс в Green API\n" +
          "   • Отсканируйте QR-код в настройках инстанса\n" +
          "   • Дождитесь статуса \"authorized\"\n\n" +

          "3. <b>Привяжите инстанс</b>\n" +
          "   • Отправьте команду:\n" +
          "     <code>/instance 1101111111 abc123abc123abc123abc123abc123</code>\n\n" +
          
          "4️. <b>Проверьте статус</b>\n" +
          "   • Используйте команду: /status\n\n" +
          
          "5️. <b>Начните работу</b>\n" +
          "   • Отправляйте сообщения в этот чат для пересылки в WhatsApp\n" +
          "   • Используйте /reply для ответов на сообщения\n\n" +
          
          "<b>Дополнительные возможности:</b>\n" +
          "   • <code>/setchat &lt;chat&gt;</code> — пересылать сообщения в другой чат\n" +
          "   • /help — все команды\n\n" +
          
          "<b>Начните с привязки инстанса!</b>",
        parse_mode: "HTML"
      });
    }
    console.log("[COMMANDS.start] Start message sent")
    return { status: "start_handled" };
  }
}