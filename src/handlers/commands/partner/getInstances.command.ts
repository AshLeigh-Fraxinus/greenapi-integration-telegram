import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";
import { PartnerApiClient } from "../../../client/partner.client";

export class GetInstancesCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(chatId: string): Promise<{ status: string; error?: string }> {
    try {
      const partnerToken = await this.storage.getPartnerToken(chatId);
      if (!partnerToken) {
        await this.bot.send({
          chat_id: chatId,
          text: "Сначала установите partner token с помощью команды /setpartnertoken"
        });
        return { status: "no_partner_token" };
      }

      const partnerClient = new PartnerApiClient(partnerToken);
      const instances = await partnerClient.getInstances();

      console.log('[GetInstancesCommand] Number of instances:', instances.length);

      if (!instances || instances.length === 0) {
        await this.bot.send({
          chat_id: chatId,
          text: "У вас нет созданных инстансов.\n\nИспользуйте /createinstance чтобы создать первый инстанс."
        });
        return { status: "no_instances" };
      }

      const activeInstances = instances.filter(instance => !instance.deleted);
      const deletedInstances = instances.filter(instance => instance.deleted);

      if (activeInstances.length === 0) {
        await this.bot.send({
          chat_id: chatId,
          text: "У вас нет активных инстансов.\n\nИспользуйте /createinstance чтобы создать новый инстанс."
        });
        return { status: "no_active_instances" };
      }

      const instancesList = activeInstances.map((instance, index) => 
        `ID: <code>${instance.idInstance}</code>\n` +
        `Название: ${instance.name}\n` +
        `Тип: ${instance.typeInstance}\n` +
        `Тариф: ${instance.tariff}\n` +
        `Создан: ${new Date(instance.timeCreated).toLocaleDateString('ru-RU')}\n` +
        `Истекает: ${new Date(instance.expirationDate).toLocaleDateString('ru-RU')}\n` +
        `Статус: ${instance.isExpired ? 'Просрочен' : 'Активен'}\n`
      ).join('\n');

      let messageText = `<b>Ваши активные инстансы:</b>\n\n${instancesList}`;

      if (deletedInstances.length > 0) {
        messageText += `\n\n<b>Удаленные инстансы:</b> ${deletedInstances.length}`;
      }

      await this.bot.send({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      });

      return { status: "instances_listed" };
    } catch (error: any) {
      console.error("[GetInstancesCommand] Failed to get instances:", error);
      
      let errorMessage = "Ошибка при получении списка инстансов. Попробуйте позже.";
      
      if (error.message?.includes('Unauthorized') || error.code === 'UNAUTHORIZED') {
        errorMessage = "Неверный partner token. Проверьте токен и попробуйте снова.";
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Ошибка сети: Не удается подключиться к сервису Green API.";
      }

      await this.bot.send({
        chat_id: chatId,
        text: errorMessage
      });
      return { status: "error", error: error.message };
    }
  }
}