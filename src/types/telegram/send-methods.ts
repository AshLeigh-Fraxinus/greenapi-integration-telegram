export interface TelegramSendMessage {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_to_message_id?: number;
  disable_web_page_preview?: boolean;
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