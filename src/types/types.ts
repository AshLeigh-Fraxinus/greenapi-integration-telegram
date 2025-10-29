import { BaseUser, Instance } from "@green-api/greenapi-integration"

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

export interface TelegramInstance extends Instance {
  whatsappNumber?: string;
  telegramChatId?: string;
  userName?: string;
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

export interface TelegramWebhook {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  text?: string;
  caption?: string;
  photo?: TelegramPhoto[];
  document?: TelegramDocument;
  location?: TelegramLocation;
  contact?: TelegramContact;
  sticker?: TelegramSticker;
  reply_to_message?: TelegramMessage;
  parseMode: 'HTML'
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramPhoto {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramVideo {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: TelegramPhoto;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramAudio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail?: TelegramPhoto;
}

export interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramPoll {
  id: string;
  question: string;
  options: TelegramPollOption[];
  total_voter_count: number;
  is_closed: boolean;
  is_anonymous: boolean;
  allows_multiple_answers?: boolean;
  correct_option_id?: number;
  explanation?: string;
  open_period?: number;
  close_date?: number;
}

export interface TelegramPollOption {
  text: string;
  voter_count: number;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  thumbnail?: TelegramPhoto;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  caption?: string;
  
}

export interface TelegramLocation {
  longitude: number;
  latitude: number;
}

export interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

export interface TelegramSticker {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  file_size?: number;
}

export interface TelegramSendMessage {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_to_message_id?: number;
  
}

export interface TelegramSendPhoto {
  chat_id: number | string;
  photo: string; 
  caption?: string;
  reply_to_message_id?: number;
  
}

export interface TelegramSendVideo {
  chat_id: number | string;
  video: string; 
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: string; 
  caption?: string;
  parse_mode?: 'Markdown' | 'HTML';
  supports_streaming?: boolean;
  reply_to_message_id?: number;
}

export interface TelegramSendAudio {
  chat_id: number | string;
  audio: string; 
  caption?: string;
  parse_mode?: 'Markdown' | 'HTML';
  duration?: number;
  performer?: string;
  title?: string;
  thumbnail?: string; 
  reply_to_message_id?: number;
}

export interface TelegramSendVoice {
  chat_id: number | string;
  voice: string; 
  caption?: string;
  parse_mode?: 'Markdown' | 'HTML';
  duration?: number;
  reply_to_message_id?: number;
}

export interface TelegramSendPoll {
  chat_id: number | string;
  question: string;
  options: string[];
  is_anonymous?: boolean;
  type?: 'regular' | 'quiz';
  allows_multiple_answers?: boolean;
  correct_option_id?: number;
  explanation?: string;
  explanation_parse_mode?: 'Markdown' | 'HTML';
  open_period?: number;
  close_date?: number;
  is_closed?: boolean;
  reply_to_message_id?: number;
}

export interface TelegramSendDocument {
  chat_id: number | string;
  document: string; 
  caption?: string;
  reply_to_message_id?: number;
  
}

export interface TelegramSendLocation {
  chat_id: number | string;
  latitude: number;
  longitude: number;
  reply_to_message_id?: number;
  
}

export interface TelegramSendContact {
  chat_id: number | string;
  phone_number: string;
  first_name: string;
  last_name?: string;
  reply_to_message_id?: number;
  
}

export type TelegramPlatformMessage = 
  | TelegramSendMessage
  | TelegramSendPhoto
  | TelegramSendVoice
  | TelegramSendVideo
  | TelegramSendAudio
  | TelegramSendDocument
  | TelegramSendPoll
  | TelegramSendLocation
  | TelegramSendContact;
  
export interface PartnerInstance {
  idInstance: number;
  name: string;
  typeInstance: string;
  typeAccount: string;
  partnerUserUiid: string;
  timeCreated: string;
  timeDeleted: string;
  apiTokenInstance: string;
  deleted: boolean;
  tariff: string;
  isFree: boolean;
  isPartner: boolean;
  expirationDate: string;
  isExpired: boolean;
}

export interface CreateInstanceResponse {
  idInstance: number;
  apiTokenInstance: string;
}

export interface PartnerInstanceList {
  data: PartnerInstanceList;
  instances: PartnerInstance[];
}