import { SQLiteStorage } from "./storage";
import { TelegramBot } from "./telegram-client";
import { TelegramAdapter } from "./telegram-adapter";
import { GreenApiClient, IntegrationError } from "@green-api/greenapi-integration";

export class TelegramHandler {
  constructor(
    private storage: SQLiteStorage,
    private adapter: TelegramAdapter
  ) {}

  async handleWebhook(req: any): Promise<{ status: string; statusCode?: number; error?: string }> {
    
    console.log('Telegram Webhook Received:', {
      timestamp: new Date().toISOString(),
    });

    try {
      const telegram_chat_id = req.body.message?.from?.id?.toString();
      const user_name = req.body.message?.from?.username?.toString();
      const first_name = req.body.message?.from?.first_name;
      const message_text = req.body.message?.text;

      console.log('User info:', { telegram_chat_id, user_name, first_name, message_text });

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
        console.log('Created new user:', user);
      }

      const instance = await this.storage.findInstanceByChatId(telegram_chat_id);
      
      if (message_text?.startsWith('/')) {
        return await this.handleCommand(message_text, telegram_chat_id, instance);
      }

      if (!instance) {
        console.log('No instance found for chat_id:', telegram_chat_id);
        
        await this.sendMessageViaAdapter(telegram_chat_id, 
          "Инстанс не привязан. Для начала работы отправьте credentials:\n" +
          "/instance 1101111111 abc123abc123abc123abc123abc123"
        );
        return { status: "waiting_for_credentials" };
      }

      console.log('Processing webhook with instance:', { 
        idInstance: instance.idInstance,
        instanceId: instance.id 
      });
      
      await this.adapter.handlePlatformWebhook(req.body, instance.idInstance);
      return { status: "ok" };
      
    } catch (error) {
      console.log("Failed to handle Telegram webhook:", error);
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
      case '/instance':
        return await this.handleInstanceCommand(messageText, chatId);
      
      case '/status':
        return await this.handleStatusCommand(chatId, instance);
      
      case '/start':
        return await this.handleStartCommand(chatId, instance);
      
      case '/reinstance':
        return await this.handleReinstanceCommand(chatId);
      
      case '/help':
        return await this.handleHelpCommand(chatId);
      
      case '/reply':
        return await this.handleReplyCommand(messageText, chatId, instance);
      
      default:
        await this.sendMessageViaAdapter(chatId, 
          "Неизвестная команда. Используйте /help для списка доступных команд."
        );
        return { status: "unknown_command" };
    }
  }

  private async handleInstanceCommand(messageText: string, chatId: string) {
    try {
      const parts = messageText.split(' ');
      if (parts.length !== 3) {
        await this.sendMessageViaAdapter(chatId, 
          "Неверный формат. Используйте:\n" +
          "/instance 1101111111 abc123abc123abc123abc123abc123\n\n" +
          "Где:\n" +
          "• 1101111111 - idInstance\n" +
          "• abc123... - apiTokenInstance"
        );
        return { status: "invalid_format" };
      }

      const idInstance = parts[1];
      const apiToken = parts[2];

      if (!idInstance || !apiToken) {
        await this.sendMessageViaAdapter(chatId, "ID инстанса и токен не могут быть пустыми");
        return { status: "invalid_credentials" };
      }

      const idInstanceNumber = Number(idInstance);
      const user = await this.storage.findUser(chatId);
      const userName = user?.user_name || `user_${chatId}`;

      await this.storage.createInstance({
        idInstance: idInstanceNumber,
        apiTokenInstance: apiToken,
        name: userName,
        token: apiToken,
        settings: {
          chatId: chatId
        }
      }, 0);

      console.log('Created/updated instance for user:', { chatId, idInstance: idInstanceNumber });

      await this.sendMessageViaAdapter(chatId, 
        "Инстанс успешно привязан!\n\n" +
        "Теперь вы можете получать и отправлять сообщения через WhatsApp.\n\n" +
        "Доступные команды:\n" +
        "• /status - статус инстанса\n" +
        "• /reinstance - сменить credentials\n" +
        "• /help - помощь"
      );

      return { status: "instance_created" };

    } catch (error) {
      console.log("Failed to handle instance command:", error);
      
      if (error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        await this.sendMessageViaAdapter(chatId, 
          "Этот инстанс уже привязан к другому пользователю Telegram.\n\n" +
          "Используйте другой idInstance или обратитесь к администратору."
        );
      } else {
        await this.sendMessageViaAdapter(chatId, "Произошла ошибка при привязке инстанса");
      }
      
      return { status: "error" };
    }
  }

  private async handleStatusCommand(chatId: string, instance: any) {
    try {
      if (!instance) {
        await this.sendMessageViaAdapter(chatId, 
          "Инстанс не привязан. Используйте /instance для привязки."
        );
        return { status: "no_instance" };
      }
      const greenApiClient = new GreenApiClient(instance);
      let stateInstance = await greenApiClient.getStateInstance();
      let settings = await greenApiClient.getSettings();
      await this.sendMessageViaAdapter(chatId, 
        `Статус инстанса:\n\n` +
        `• ID инстанса: ${instance.idInstance}\n` +
        `• Статус: ${stateInstance.stateInstance}\n` +
        `• Номер телефона: ${settings.wid}\n\n` +
        `Для смены инстанса используйте /reinstance\n`
      );

      return { status: "status_checked" };

    } catch (error) {
      console.log("Failed to handle status command:", error);
      await this.sendMessageViaAdapter(chatId, "❌ Ошибка при проверке статуса инстанса");
      return { status: "error" };
    }
  }

  private async handleStartCommand(chatId: string, instance: any) {
    if (instance) {
      await this.sendMessageViaAdapter(chatId, 
        "Бот уже настроен и готов к работе!\n\n" +
        "Отправляйте сообщения, и они будут пересылаться в WhatsApp.\n\n" +
        "Доступные команды:\n" +
        "• /status - статус инстанса\n" +
        "• /reinstance - сменить credentials\n" +
        "• /help - помощь"
      );
    } else {
      await this.sendMessageViaAdapter(chatId, 
        "Добро пожаловать! Для начала работы необходимо привязать инстанс Green API.\n\n" +
        "Отправьте credentials в формате:\n" +
        "/instance 1101111111 abc123abc123abc123abc123abc123\n\n" +
        "Где:\n" +
        "• 1101111111 - idInstance\n" +
        "• abc123... - apiTokenInstance"
      );
    }
    return { status: "start_handled" };
  }

  private async handleReinstanceCommand(chatId: string) {
    try {
      const instance = await this.storage.findInstanceByChatId(chatId);
      if (instance) {
        await this.storage.removeInstance(instance.id);
      }

      await this.sendMessageViaAdapter(chatId, 
        "Привязка инстанса сброшена. Теперь вы можете привязать новый инстанс:\n\n" +
        "/instance 1101111111 abc123abc123abc123abc123abc123\n\n" +
        "Где:\n" +
        "• 1101111111 - idInstance\n" +
        "• abc123... - apiTokenInstance"
      );

      return { status: "reinstance_handled" };

    } catch (error) {
      console.log("Failed to handle reinstance command:", error);
      await this.sendMessageViaAdapter(chatId, "Ошибка при сбросе инстанса");
      return { status: "error" };
    }
  }

  private async handleHelpCommand(chatId: string) {
    await this.sendMessageViaAdapter(chatId, 
      "Доступные команды:\n\n" +
      "• /start - начать работу\n" +
      "• /instance <id> <token> - привязать инстанс Green API\n" +
      "• /status - проверить статус инстанса\n" +
      "• /reinstance - сменить привязанный инстанс\n" +
      "• /reply <chatId> <message> - отправить сообщение в WhatsApp\n\n" +
      "После привязки инстанса сообщения, полученные в WhatsApp, будут отправляться сюда."
    );
    return { status: "help_shown" };
  }

  private async handleReplyCommand(messageText: string, chatId: string, instance: any) {
    try {
      if (!instance) {
        await this.sendMessageViaAdapter(chatId, 
          "Инстанс не привязан. Используйте /instance для привязки."
        );
        return { status: "no_instance" };
      }

      const replyContent = messageText.substring('/reply '.length).trim();
      
      const firstSpaceIndex = replyContent.indexOf(' ');
      if (firstSpaceIndex === -1) {
        await this.sendMessageViaAdapter(chatId, 
          "Неверный формат. Используйте:\n" +
          "/reply <chatId> <message>\n\n" +
          "Например:\n" +
          "/reply 1234567890@c.us Привет!"
        );
        return { status: "invalid_format" };
      }

      let whatsappChatId = replyContent.substring(0, firstSpaceIndex);
      const message = replyContent.substring(firstSpaceIndex + 1);

      if (!whatsappChatId || !message) {
        await this.sendMessageViaAdapter(chatId, 
          "ChatId и сообщение не могут быть пустыми"
        );
        return { status: "invalid_content" };
      }

      if (!whatsappChatId.includes('@')) {
        whatsappChatId += '@c.us';
      }

      const greenApiClient = new GreenApiClient(instance);
        await greenApiClient.sendMessage({
          chatId: whatsappChatId,
          message: message,
          type: "text"
        });

        await this.sendMessageViaAdapter(chatId, 
          `Сообщение отправлено в WhatsApp:\n` +
          `Чат: ${whatsappChatId}\n` +
          `Текст: ${message}`
        );

        return { status: "message_sent" };

      } catch (error) {
        console.log("Failed to handle reply command:", error);
        await this.sendMessageViaAdapter(chatId, 
          "Ошибка при отправке сообщения: " + (error || "Unknown error")
        );
        return { status: "error" };
      }
    }
  

  private async sendMessageViaAdapter(chatId: string, text: string) {
    try {
      const systemBotToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!systemBotToken) {
        throw new Error("TELEGRAM_BOT_TOKEN not configured");
      }

      const telegramBot = new TelegramBot(systemBotToken);
      
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: text
      });
      console.log("[HANDLER] message:", text, 'sent to :', chatId)
      
    } catch (error) {
      console.log("Failed to send message via adapter:", error);
      throw error;
    }
  }
}