import { PartnerApiClient } from "../../../client/partner.client";
import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { Localization } from "../../../utils/localization";

export class CreateInstanceCommand {
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
          text: Localization.getMessage('no_partner_token', language),
          parse_mode: "HTML"
        });
        return { status: "no_partner_token" };
      }

      const partnerClient = new PartnerApiClient(partnerToken);
      const result = await partnerClient.createInstance();

      const message = language === 'ru' || language === 'kz' ? 
        `Инстанс успешно создан!\n\nID: ${result.idInstance}\nToken: ${result.apiTokenInstance}\n\nСохраните эти данные!\n\nСписок инстансов аккаунта можно получить командой: /getInstances` :
        `Instance successfully created!\n\nID: ${result.idInstance}\nToken: ${result.apiTokenInstance}\n\nSave this data!\n\nGet account instances list with command: /getInstances`;

      await this.bot.send({
        chat_id: chatId,
        text: message
      });
      return { 
        status: "instance_created", 
      };
    } catch (error: any) {
      console.error("[CreateInstanceCommand] Failed to create instance:", error);
      
      let errorMessage = Localization.getMessage('error_creating_instance', language);
      if (error.message?.includes('Unauthorized')) {
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