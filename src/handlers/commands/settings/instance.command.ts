import axios from "axios";
import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { getSettings } from '../methods/getSettings'
import { setWebhook } from './setWebhook'
import { Localization } from "../../../utils/localization";

export class InstanceCommand {
  private setWebhook: setWebhook;
  private getSettings: getSettings

  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {
    this.setWebhook = new setWebhook(storage, bot);
    this.getSettings = new getSettings(storage, bot)
  }

  async execute (messageText: string, chatId: string, language: string = 'en'): Promise<{ status: string }> {
    console.log("[COMMANDS.instance] Handling command")
    try {
      const parts = messageText.split(' ');
      if (parts.length !== 3) {
        console.log("[COMMANDS.instance] Incorrect message format")
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getInstanceFormatText(language)
        });
        return { status: "invalid_format" };
      }

      const idInstance = parts[1];
      const apiToken = parts[2];

      const response = await axios.get(
        `https://api.green-api.com/waInstance${idInstance}/getSettings/${apiToken}`
      );
      const settings = response.data;

      const idInstanceNumber = Number(idInstance);
      const user = await this.storage.findUser(chatId);
      const userName = user?.user_name || `user_${chatId}`;

      const instanceData = {
        idInstance: idInstanceNumber,
        apiTokenInstance: apiToken,
        name: userName,
        token: apiToken,
        settings: {
          chatId: chatId,
          incomingWebhook: settings.incomingWebhook,
          outgoingWebhook: settings.outgoingWebhook,
          stateWebhook: settings.stateWebhook
        }
      };

      await this.storage.createInstance(instanceData, BigInt(chatId));

      console.log('[COMMANDS.instance] Created/updated instance for user:', { chatId, idInstance: idInstanceNumber });

      const setWebhook = await this.setWebhook.execute(instanceData);

      const message = Localization.getInstanceSuccessText(language, setWebhook ? process.env.WEBHOOK_URL : undefined);

      await this.bot.send({
        chat_id: chatId,
        text: message
      });

      console.log("[COMMANDS.instance] Instance saved")
      return { status: "instance_created" };

    } catch (error) {
      console.log("[COMMANDS.instance] Failed to handle instance command:", error);
      
      if (error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getMessage('instance_already_linked', language)
        });
      } else {
        await this.bot.send({
          chat_id: chatId,
          text: Localization.getMessage('error_occurred', language)
        });
      }
      
      return { status: "error" };
    }
  }
}