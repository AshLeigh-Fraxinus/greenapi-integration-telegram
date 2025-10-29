import { GreenApiClient } from "@green-api/greenapi-integration";
import { TelegramBot } from "../../../client/telegram.client";
import { Instance } from "@green-api/greenapi-integration";
import { SQLiteStorage } from "../../../core/storage";

export class setWebhook {
  private webhookUrl: string;

  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {
    this.webhookUrl = process.env.WEBHOOK_URL || '';
    if (!this.webhookUrl) {
      console.warn('[SET-SETTINGS] ]WEBHOOK_URL не установлен в .env файле');
    }
  }

  async execute(instance: Instance): Promise<boolean> {
    if (!this.webhookUrl) {
      console.error('[WEBHOOK-SETTER] WEBHOOK_URL не установлен');
      return false;
    }

    try {
      const greenApiClient = new GreenApiClient(instance);
      const fullWebhookUrl = `${this.webhookUrl}/webhook/whatsapp`;

      await greenApiClient.setSettings({
        webhookUrl: fullWebhookUrl,
        outgoingWebhook: 'yes',
        stateWebhook: 'yes',
        incomingWebhook: 'yes'
      });

      console.log(`[SET-SETTINGS] Вебхук установлен для инстанса ${instance.idInstance}: ${fullWebhookUrl}`);
      return true;
    } catch (error) {
      console.error(`[SET-SETTINGS] Ошибка установки вебхука для инстанса ${instance.idInstance}:`, error);
      return false;
    }
  }

  async verifyWebhook(instance: Instance): Promise<boolean> {
    try {
      const greenApiClient = new GreenApiClient(instance);
      const settings = await greenApiClient.getSettings();
      
      const expectedWebhookUrl = `${this.webhookUrl}/webhook/whatsapp`;
      const isWebhookSet = settings.webhookUrl === expectedWebhookUrl;
      
      console.log(`[SET-SETTINGS] Проверка вебхука для инстанса ${instance.idInstance}:`, {
        expected: expectedWebhookUrl,
        actual: settings.webhookUrl,
        match: isWebhookSet
      });
      
      return isWebhookSet;
    } catch (error) {
      console.error(`[SET-SETTINGS] Ошибка проверки вебхука для инстанса ${instance.idInstance}:`, error);
      return false;
    }
  }
}