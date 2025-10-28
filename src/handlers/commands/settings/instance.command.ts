import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";
import { setSettings } from '../methods/setSettings'

export class InstanceCommand {
  private setSettings: setSettings;

  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {
    this.setSettings = new setSettings(storage, bot);
  }

  async execute (messageText: string, chatId: string): Promise<{ status: string }> {
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

      const instanceData = {
        idInstance: idInstanceNumber,
        apiTokenInstance: apiToken,
        name: userName,
        token: apiToken,
        settings: {
          chatId: chatId
        }
      };

      await this.storage.createInstance(instanceData, BigInt(chatId));

      console.log('[COMMANDS.instance] Created/updated instance for user:', { chatId, idInstance: idInstanceNumber });

      const setSettings = await this.setSettings.execute(instanceData);

      let message = "Инстанс успешно привязан!\n\n";

      if (setSettings) {
        message += "Вебхук автоматически установлен.\n\n";
      } else {
        message += "Не удалось установить вебхук автоматически. " +
                  "Пожалуйста, установите его вручную в настройках Green API:\n" +
                  `URL: ${process.env.WEBHOOK_URL}/webhook/whatsapp\n\n`;
      }

      message += "Теперь вы можете получать и отправлять сообщения через WhatsApp.\n\n" +
                "Доступные команды:\n" +
                "• /status - статус инстанса\n" +
                "• /resetInstance - сменить инстанс\n" +
                "• /help - помощь";

      await this.bot.send({
        chat_id: chatId,
        text: message
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