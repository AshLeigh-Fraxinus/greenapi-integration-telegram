import { Instance } from "@green-api/greenapi-integration";

export interface TelegramInstance extends Instance {
  whatsappNumber?: string;
  telegramChatId?: string;
  userName?: string;
}