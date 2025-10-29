import { GreenApiClient, IntegrationError } from "@green-api/greenapi-integration";
import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";

export class getSettings {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string, instance: any): Promise<{ status: string }> {
    console.log("[COMMANDS.status] Handling command")

    try {
      if (!instance) {
        await this.bot.send({
          chat_id: chatId,
          text: "Инстанс не привязан. Используйте /instance для привязки.\n\nПошаговая инструкция для начала работы: /start"
        });
        console.log("[COMMANDS.reply] No connected Instance for user");
        return { status: "no_instance" };
      } else {
        try {
          const greenApiClient = new GreenApiClient(instance);
          let stateInstance = await greenApiClient.getStateInstance();
          console.log("[COMMANDS.status] Instance", instance.idInstance, stateInstance);
          
          let settings = await greenApiClient.getSettings();
          
          await this.bot.send({
            chat_id: chatId,
            text: `Статус инстанса:\n\n` +
              `• ID инстанса: ${instance.idInstance}\n` +
              `• Статус: ${stateInstance.stateInstance}\n` +
              `• Номер телефона: ${settings.wid}\n\n` +
              `• Получение входящих сообщений: ${settings.incomingWebhook}\n` +
              `• Получение статусов отправленных сообщений: ${settings.outgoingWebhook}\n` +
              `• Получение статуса инстанса: ${settings.stateWebhook}\n\n` +
              `Для смены инстанса используйте /resetInstance\n`
          });

          console.log("[COMMANDS.status] Status message sent");
          return { status: "status_checked" };

        } catch (error) {
          console.log("[COMMANDS.status] Failed to handle status command:", error);
          await this.bot.send({
            chat_id: chatId,
            text: "Ошибка при проверке статуса инстанса"
          });
          return { status: "error" };
        }
      }
    } catch (error) { 
      console.log("[COMMANDS.status] Unexpected error:", error);
      return { status: "unexpected_error" };
    }
  }
}