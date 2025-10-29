import { GreenApiClient, IntegrationError } from "@green-api/greenapi-integration";
import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { Localization } from "../../../utils/localization";

export class getSettings {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string, instance: any, language: string = 'en'): Promise<{ status: string }> {
    console.log("[COMMANDS.status] Handling command")

    try {
      if (!instance) {
        const message = language === 'ru' || language === 'kz' ? 
          "Инстанс не привязан. Используйте /instance для привязки.\n\nПошаговая инструкция для начала работы: /start" :
          "Instance not linked. Use /instance to link.\n\nStep-by-step setup guide: /start";

        await this.bot.send({
          chat_id: chatId,
          text: message
        });
        console.log("[COMMANDS.reply] No connected Instance for user");
        return { status: "no_instance" };
      } else {
        try {
          const greenApiClient = new GreenApiClient(instance);
          let stateInstance = await greenApiClient.getStateInstance();
          console.log("[COMMANDS.status] Instance", instance.idInstance, stateInstance);
          
          let settings = await greenApiClient.getSettings();
          
          const webhookStatus = (setting: string | undefined) => {
            const status = setting === 'yes' ? 
              (language === 'ru' || language === 'kz' ? 'включено' : 'enabled') : 
              (language === 'ru' || language === 'kz' ? 'выключено' : 'disabled');
            return status;
          };

          const message = language === 'ru' || language === 'kz' ? 
            `Статус инстанса:

• ID инстанса: ${instance.idInstance}
• Статус: ${stateInstance.stateInstance}
• Номер телефона: ${settings.wid || 'не указан'}

• Получение входящих сообщений: ${webhookStatus(settings.incomingWebhook)}
• Получение статусов отправленных сообщений: ${webhookStatus(settings.outgoingWebhook)}
• Получение статуса инстанса: ${webhookStatus(settings.stateWebhook)}

Для смены инстанса используйте /resetInstance` :
            `Instance status:

• Instance ID: ${instance.idInstance}
• Status: ${stateInstance.stateInstance}
• Phone number: ${settings.wid || 'not specified'}

• Incoming messages: ${webhookStatus(settings.incomingWebhook)}
• Outgoing message statuses: ${webhookStatus(settings.outgoingWebhook)}
• Instance status: ${webhookStatus(settings.stateWebhook)}

Use /resetInstance to change instance`;

          await this.bot.send({
            chat_id: chatId,
            text: message
          });

          console.log("[COMMANDS.status] Status message sent");
          return { status: "status_checked" };

        } catch (error) {
          console.log("[COMMANDS.status] Failed to handle status command:", error);
          await this.bot.send({
            chat_id: chatId,
            text: Localization.getMessage('error_checking_status', language)
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