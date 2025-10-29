import { BaseUser } from "@green-api/greenapi-integration";

export interface TelegramUser extends BaseUser {
  chat_id: string;
  user_name: string;
  target_chat_id?: string;
  language?: string;
  state?: string;
  idInstance?: number;
  apiTokenInstance?: string;
  partner_token?: string;
  incoming_webhook?: boolean;
  outgoing_webhook?: boolean;
  state_webhook?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreateData {
  chat_id: string;
  user_name?: string;
  language?: string;
}

export interface UserUpdateData {
  user_name?: string;
  language?: string;
}