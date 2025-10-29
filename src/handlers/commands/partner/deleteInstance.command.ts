import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { PartnerApiClient } from "../../../client/partner.client";
import { Localization } from "../../../utils/localization";

export class DeleteInstanceCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string, language: string = 'en'): Promise<{ status: string; error?: string }> {
    let instanceId: string | undefined;
    try {
      const instanceId = messageText.split(' ')[1];
      if (!instanceId) {
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getMessage('missing_instance_id', language)
        });
        return { status: "missing_instance_id" };
      }

      if (!/^\d+$/.test(instanceId)) {
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getMessage('invalid_instance_id', language)
        });
        return { status: "invalid_instance_id" };
      }

      const partnerToken = await this.storage.getPartnerToken(chatId);
      if (!partnerToken) {
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getMessage('no_partner_token', language),
          parse_mode: "HTML"
        });
        return { status: "no_partner_token" };
      }

      const partnerClient = new PartnerApiClient(partnerToken);
      await partnerClient.deleteInstanceAccount(parseInt(instanceId));

      try {
        await this.storage.removeInstance(parseInt(instanceId));
      } catch (error) {
        console.log("[DeleteInstanceCommand] Instance not found in local storage, continuing...");
      }

      const message = language === 'ru' || language === 'kz' ? 
        `Инстанс ${instanceId} успешно удален!` :
        `Instance ${instanceId} successfully deleted!`;

      await this.bot.send({
        chat_id: chatId,
        text: message
      });
      return { status: "instance_deleted" };
    } catch (error: any) {
      console.error("[DeleteInstanceCommand] Failed to delete instance:", error);
      
      let errorMessage = Localization.getMessage('error_deleting_instance', language);
      if (error.message?.includes('Not Found')) {
        errorMessage = language === 'ru' || language === 'kz' ? 
          `Инстанс с ID ${instanceId} не найден.` :
          `Instance with ID ${instanceId} not found.`;
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = Localization.getMessage('unauthorized', language);
      }

      await this.bot.send({
        chat_id: chatId,
        text: errorMessage
      });
      return { status: "error", error: error.message };
    }
  }
}