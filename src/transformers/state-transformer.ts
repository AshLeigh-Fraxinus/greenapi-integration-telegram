import { StateInstanceWebhook } from "@green-api/greenapi-integration";
import { TelegramPlatformMessage } from "../types/telegram";
import { BaseTransformer } from "./base-transformer";
import { SQLiteStorage } from "../storage/storage";

export class StateTransformer extends BaseTransformer {
  constructor(storage: SQLiteStorage) {
    super(storage);
  }

  handleStateInstanceChanged(webhook: StateInstanceWebhook, language: string = 'en'): TelegramPlatformMessage {
    const messageText = language === 'ru' || language === 'kz' ? 
      `Изменение статуса инстанса ${webhook.instanceData.idInstance}: ${webhook.stateInstance}` :
      `Instance status change ${webhook.instanceData.idInstance}: ${webhook.stateInstance}`;
    
    return {
      chat_id: "",
      text: messageText,
      parse_mode: 'HTML'
    };
  }

  async handleStateInstanceChangedWithUser(webhook: StateInstanceWebhook, language: string = 'en'): Promise<TelegramPlatformMessage> {
    const user = await this.storage.findUserByInstanceId(webhook.instanceData.idInstance);

    if (!user) {
      const errorText = language === 'ru' || language === 'kz' ? 
        `Ошибка: пользователь для инстанса ${webhook.instanceData.idInstance} не найден` :
        `Error: user for instance ${webhook.instanceData.idInstance} not found`;
      
      return {
        chat_id: "",
        text: errorText,
        parse_mode: 'HTML'
      };
    }

    const apiTokenInstance = user.apiTokenInstance;

    const stateMapRu: { [key: string]: string } = {
      authorized: "<code>authorized</code>\n\nИнстанс авторизован и готов к работе",
      notAuthorized: "<code>notAuthorized</code>\n\nИнстанс не авторизован.\n" +
      "Для авторизации инстанса перейдите по ссылке:\n" +
      "https://qr.green-api.com/waInstance" + webhook.instanceData.idInstance + "/" + apiTokenInstance,
      blocked: "<code>blocked</code>",
      starting: "<code>starting</code>\n\nИнстанс в процессе запуска (сервисный режим).\n" +
      "Происходит перезагрузка инстанса, сервера или инстанс в режиме обслуживания. " +
      "Может потребоваться до 5 минут для перехода состояния инстанса в значение <code>authorized</code>"
    };

    const stateMapEn: { [key: string]: string } = {
      authorized: "<code>authorized</code>\n\nInstance authorized and ready to work",
      notAuthorized: "<code>notAuthorized</code>\n\nInstance not authorized.\n" +
      "To authorize instance follow the link:\n" +
      "https://qr.green-api.com/waInstance" + webhook.instanceData.idInstance + "/" + apiTokenInstance,
      blocked: "<code>blocked</code>",
      starting: "<code>starting</code>\n\nInstance is starting (service mode).\n" +
      "Instance restart, server restart or instance in maintenance mode. " +
      "It may take up to 5 minutes for instance state to change to <code>authorized</code>"
    };

    const stateMap = language === 'ru' || language === 'kz' ? stateMapRu : stateMapEn;
    const state = stateMap[webhook.stateInstance] || webhook.stateInstance;

    const headerText = language === 'ru' || language === 'kz' ? 
      `<b>Изменение статуса инстанса ${webhook.instanceData.idInstance}</b>: ${state}` :
      `<b>Instance status change ${webhook.instanceData.idInstance}</b>: ${state}`;
    
    return {
      chat_id: "",
      text: headerText,
      parse_mode: 'HTML'
    };
  }
}