import { GreenApiClient } from "@green-api/greenapi-integration";
import { TelegramBot } from "../../../client/telegram.client";
import { Instance } from "@green-api/greenapi-integration";
import { SQLiteStorage } from "../../../storage/storage";

export class setWebhook {
  private webhookUrl: string;

  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {
    this.webhookUrl = process.env.WEBHOOK_URL || '';
    if (!this.webhookUrl) {
      console.warn('[SET-SETTINGS] WEBHOOK_URL is not set in .env file');
    }
  }

  async execute(instance: Instance): Promise<boolean> {
    if (!this.webhookUrl) {
      console.error('[WEBHOOK-SETTER] WEBHOOK_URL is not set');
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

      console.log(`[SET-SETTINGS] Webhook set for instance ${instance.idInstance}: ${fullWebhookUrl}`);
      return true;
    } catch (error) {
      console.error(`[SET-SETTINGS] Error setting webhook for instance ${instance.idInstance}:`, error);
      return false;
    }
  }

  async verifyWebhook(instance: Instance): Promise<boolean> {
    try {
      const greenApiClient = new GreenApiClient(instance);
      const settings = await greenApiClient.getSettings();
      
      const expectedWebhookUrl = `${this.webhookUrl}/webhook/whatsapp`;
      const isWebhookSet = settings.webhookUrl === expectedWebhookUrl;
      
      console.log(`[SET-SETTINGS] Webhook verification for instance ${instance.idInstance}:`, {
        expected: expectedWebhookUrl,
        actual: settings.webhookUrl,
        match: isWebhookSet
      });
      
      return isWebhookSet;
    } catch (error) {
      console.error(`[SET-SETTINGS] Error verifying webhook for instance ${instance.idInstance}:`, error);
      return false;
    }
  }
}