import { SQLiteStorage } from "../../core/storage";
import { TelegramBot } from "../../client/telegram.client";

export interface CommandContext {
  storage: SQLiteStorage;
  bot: TelegramBot;
  chatId: string;
  instance?: any;
}

export interface Command {
  execute(args?: string[]): Promise<{ status: string; [key: string]: any }>;
}