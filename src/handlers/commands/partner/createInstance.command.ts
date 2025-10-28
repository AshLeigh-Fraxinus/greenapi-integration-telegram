import { PartnerApiClient } from "../../../client/partner.client";
import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";


export class CreateInstanceCommand {
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
          text: "Сначала установите partner token с помощью команды <code>/setpartnertoken &lt;token&gt;</code>",
          parse_mode: "HTML"
        });
        return { status: "no_partner_token" };
      }

      const partnerClient = new PartnerApiClient(partnerToken);
      const result = await partnerClient.createInstance();

      await this.bot.send({
        chat_id: chatId,
        text: `Инстанс успешно создан!\n\nID: ${result.idInstance}\nToken: ${result.apiTokenInstance}\n\nСохраните эти данные!\n\nСписок инстансов аккаунта можно получить командой: /getInstances`
      });
      return { 
        status: "instance_created", 
      };
    } catch (error: any) {
      console.error("[CreateInstanceCommand] Failed to create instance:", error);
      const errorMessage = error.message?.includes('Unauthorized') 
        ? "Неверный partner token. Проверьте токен и попробуйте снова."
        : "Ошибка при создании инстанса. Попробуйте позже.";
      
      await this.bot.send({
        chat_id: chatId,
        text: errorMessage
      });
      return { status: "error", error: error.message };
    }
  }
}