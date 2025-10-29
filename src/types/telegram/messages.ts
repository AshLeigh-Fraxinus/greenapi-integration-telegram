export interface TelegramMessage {
  message_id: number;
  from?: any; // Будет импортирован из user/types
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
  disable_web_page_preview: boolean;
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