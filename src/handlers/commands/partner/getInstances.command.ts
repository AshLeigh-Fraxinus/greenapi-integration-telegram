import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { PartnerApiClient } from "../../../client/partner.client";
import { Localization } from "../../../utils/localization";

export class GetInstancesCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string, language: string = 'en'): Promise<{ status: string; error?: string }> {
    try {
      const partnerToken = await this.storage.getPartnerToken(chatId);
      if (!partnerToken) {
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getMessage('no_partner_token', language)
        });
        return { status: "no_partner_token" };
      }

      const partnerClient = new PartnerApiClient(partnerToken);
      const instances = await partnerClient.getInstances();

      console.log('[GetInstancesCommand] Number of instances:', instances.length);

      if (!instances || instances.length === 0) {
        const message = language === 'ru' || language === 'kz' ? 
          "У вас нет созданных инстансов.\n\nИспользуйте /createinstance чтобы создать первый инстанс." :
          "You have no created instances.\n\nUse /createinstance to create first instance.";

        await this.bot.send({
          chat_id: chatId,
          text: message
        });
        return { status: "no_instances" };
      }

      const activeInstances = instances.filter(instance => !instance.deleted);
      const deletedInstances = instances.filter(instance => instance.deleted);

      if (activeInstances.length === 0) {
        const message = language === 'ru' || language === 'kz' ? 
          "У вас нет активных инстансов.\n\nИспользуйте /createinstance чтобы создать новый инстанс." :
          "You have no active instances.\n\nUse /createinstance to create new instance.";

        await this.bot.send({
          chat_id: chatId,
          text: message
        });
        return { status: "no_active_instances" };
      }

      const dateFormat = language === 'ru' || language === 'kz' ? 'ru-RU' : 'en-US';
      const statusText = (isExpired: boolean) => isExpired ? 
        (language === 'ru' || language === 'kz' ? 'Просрочен' : 'Expired') : 
        (language === 'ru' || language === 'kz' ? 'Активен' : 'Active');

      const instancesList = activeInstances.map((instance, index) => 
        `ID: <code>${instance.idInstance}</code>\n` +
        (language === 'ru' || language === 'kz' ? 
          `Название: ${instance.name}\n` +
          `Тип: ${instance.typeInstance}\n` +
          `Тариф: ${instance.tariff}\n` +
          `Создан: ${new Date(instance.timeCreated).toLocaleDateString(dateFormat)}\n` +
          `Истекает: ${new Date(instance.expirationDate).toLocaleDateString(dateFormat)}\n` +
          `Статус: ${statusText(instance.isExpired)}\n` :
          `Name: ${instance.name}\n` +
          `Type: ${instance.typeInstance}\n` +
          `Tariff: ${instance.tariff}\n` +
          `Created: ${new Date(instance.timeCreated).toLocaleDateString(dateFormat)}\n` +
          `Expires: ${new Date(instance.expirationDate).toLocaleDateString(dateFormat)}\n` +
          `Status: ${statusText(instance.isExpired)}\n`)
      ).join('\n');

      let messageText = language === 'ru' || language === 'kz' ? 
        `<b>Ваши активные инстансы:</b>\n\n${instancesList}` :
        `<b>Your active instances:</b>\n\n${instancesList}`;

      if (deletedInstances.length > 0) {
        messageText += language === 'ru' || language === 'kz' ? 
          `\n\n<b>Удаленные инстансы:</b> ${deletedInstances.length}` :
          `\n\n<b>Deleted instances:</b> ${deletedInstances.length}`;
      }

      await this.bot.send({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      });

      return { status: "instances_listed" };
    } catch (error: any) {
      console.error("[GetInstancesCommand] Failed to get instances:", error);
      
      let errorMessage = Localization.getMessage('error_getting_instances', language);
      if (error.message?.includes('Unauthorized') || error.code === 'UNAUTHORIZED') {
        errorMessage = Localization.getMessage('unauthorized', language);
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = Localization.getMessage('network_error', language);
      }

      await this.bot.send({
        chat_id: chatId,
        text: errorMessage
      });
      return { status: "error", error: error.message };
    }
  }
}