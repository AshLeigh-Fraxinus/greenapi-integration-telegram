import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";
import { PartnerApiClient } from "../../../client/partner.client";

export class DeleteInstanceCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string): Promise<{ status: string; error?: string }> {
    let instanceId: string | undefined;
    try {
      const instanceId = messageText.split(' ')[1];
      if (!instanceId) {
        await this.bot.send({
          chat_id: chatId,
          text: "Пожалуйста, укажите ID инстанса. Использование: /deleteinstance <instance_id>"
        });
        return { status: "missing_instance_id" };
      }

      if (!/^\d+$/.test(instanceId)) {
        await this.bot.send({
          chat_id: chatId,
          text: "ID инстанса должен быть числом."
        });
        return { status: "invalid_instance_id" };
      }

      const partnerToken = await this.storage.getPartnerToken(chatId);
      if (!partnerToken) {
        await this.bot.send({
          chat_id: chatId,
          text: "Сначала установите partner token с помощью команды /setpartnertoken <token>",
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

      await this.bot.send({
        chat_id: chatId,
        text: `Инстанс ${instanceId} успешно удален!`
      });
      return { status: "instance_deleted" };
    } catch (error: any) {
      console.error("[DeleteInstanceCommand] Failed to delete instance:", error);
      
      let errorMessage = "Ошибка при удалении инстанса.";
      if (error.message?.includes('Not Found')) {
        errorMessage = `Инстанс с ID ${instanceId} не найден.`;
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = "Неверный partner token.";
      }

      await this.bot.send({
        chat_id: chatId,
        text: errorMessage
      });
      return { status: "error", error: error.message };
    }
  }
}