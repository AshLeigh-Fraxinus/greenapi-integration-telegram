import { IntegrationError } from "@green-api/greenapi-integration";
import { TelegramBot } from "../client/telegram.client";
import { SQLiteStorage } from "../core/storage";
import {
  StartCommand,
  InstanceCommand,
  ReinstanceCommand,
  StatusCommand,
  HelpCommand,
  ReplyCommand
} from "./commands";

export class TelegramHandler {
  private bot: TelegramBot;

  constructor(
    private storage: SQLiteStorage
  ) {
    const systemBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!systemBotToken) {
      throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }
    this.bot = new TelegramBot(systemBotToken);
  }

  async handleWebhook(req: any): Promise<{ status: string; statusCode?: number; error?: string }> {
    
    console.log('[HANDLER] Telegram Webhook Received:');

    try {
      const telegram_chat_id = req.body.message?.from?.id?.toString();
      const user_name = req.body.message?.from?.username?.toString();
      const first_name = req.body.message?.from?.first_name;
      const message_text = req.body.message?.text;

      console.log('[HANDLER] "User info:"', { telegram_chat_id, user_name, first_name, message_text });

      if (!telegram_chat_id) {
        return { status: "error", statusCode: 200, error: "No chat_id in webhook" };
      }

      if (!user_name) {
        return { status: "error", statusCode: 200, error: "Messages from chats and channels are not supported" };
      }

      let user = await this.storage.findUser(telegram_chat_id);
      if (!user) {
        user = await this.storage.createUser({
          chat_id: telegram_chat_id,
          user_name: user_name,
          first_name: first_name
        });
        console.log('[HANDLER] Created new user:', user);
      }

      const instance = await this.storage.findInstanceByChatId(telegram_chat_id);
      
      if (message_text?.startsWith('/')) {
        return await this.handleCommand(message_text, telegram_chat_id, instance);
      }

      await this.sendMessageViaAdapter(telegram_chat_id, 
          "Пожалуйста, используйте команды для взаимодействия с ботом. Для списка команд используйте /help."
      );
      console.log('[HANDLER] Message has no command, it will be skipped');
      return { status: "non_command_message" };
      
    } catch (error) {
      console.log("[HANDLER] Failed to handle Telegram webhook:", error);
      if (error instanceof IntegrationError) {
        return { status: "error", statusCode: error.statusCode, error: error.message };
      }
      
      return { status: "error", statusCode: 500, error: "Internal server error" };
    }
  }

  private async handleCommand(messageText: string, chatId: string, instance: any) {
    const command = messageText.split(' ')[0];
    console.log("[HANDLER] received command: ", command);
    
    switch (command) {
      case '/start':
        const startCommand = new StartCommand(this.storage, this.bot);
        return await startCommand.execute(chatId, instance);

      case '/instance':
        const instanceCommand = new InstanceCommand(this.storage, this.bot);
        return await instanceCommand.execute(messageText, chatId);

      case '/reinstance':
        const reinstanceCommand = new ReinstanceCommand(this.storage, this.bot);
        return await reinstanceCommand.execute(chatId);

      case '/status':
      case '/getStateInstance':
        const statusCommand = new StatusCommand(this.storage, this.bot);
        return await statusCommand.execute(chatId, instance);

      case '/help':
        const helpCommand = new HelpCommand(this.bot);
        return await helpCommand.execute(chatId);

      case '/reply':
      case '/sendMessage':
        const replyCommand = new ReplyCommand(this.bot);
        return await replyCommand.execute(messageText, chatId, instance);

      default:
        await this.sendMessageViaAdapter(chatId, 
          "Неизвестная команда. Используйте /help для списка доступных команд."
        );
        console.log('[HANDLER] Unknown command:', command);
        return { status: "unknown_command" };
    }
  }

  private async sendMessageViaAdapter(chatId: string, text: string) {
    try {
      await this.bot.send({
        chat_id: chatId,
        text: text
      });
      console.log("[HANDLER] message sent to :", chatId);
    } catch (error) {
      console.log("[HANDLER] Failed to send message via adapter:", error);
      throw error;
    }
  }
}