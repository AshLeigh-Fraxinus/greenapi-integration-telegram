import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";

export class NotificationsCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string): Promise<{ status: string }> {
    console.log("[COMMANDS.notifications] Handling command with args:", messageText);

    const args = messageText.split(' ').slice(1);

    if (args.length === 0) {
      return await this.showCurrentSettings(chatId);
    }

    if (args.length !== 2) {
      await this.bot.send({
        chat_id: chatId,
        text: "Неправильный формат команды.\n\nИспользуйте:\n• <code>/notifications on incoming</code>\n• <code>/notifications off outgoing</code>\n• <code>/notifications on status</code>\n• <code>/notifications</code> - показать текущие настройки",
        parse_mode: "HTML"
      });
      return { status: "invalid_format" };
    }

    const action = args[0].toLowerCase();
    const type = args[1].toLowerCase();

    if (action !== 'on' && action !== 'off') {
      await this.bot.send({
        chat_id: chatId,
        text: "Неправильное действие. Используйте <code>on</code> или <code>off</code>",
        parse_mode: "HTML"
      });
      return { status: "invalid_action" };
    }

    return await this.toggleNotification(chatId, action, type);
  }

  private async showCurrentSettings(chatId: string): Promise<{ status: string }> {
    try {
      const settings = await this.storage.getNotificationSettings(chatId);
      
      const statusText = (enabled: boolean) => enabled ? "включена" : "выключена";
      
      const message = `<b>Настройки уведомлений</b>\n\n` +
        `<b>Входящие сообщения</b>: ${statusText(settings.incomingWebhook)}\n` +
        `<b>Статусы отправленных</b>: ${statusText(settings.outgoingWebhook)}\n` +
        `<b>Статус инстанса</b>: ${statusText(settings.stateWebhook)}\n\n` +
        `<b>Использование:</b>\n` +
        `<code>/notifications on incoming</code> - включить входящие\n` +
        `<code>/notifications off state</code> - выключить статусы\n` +
        `<code>/notifications all on</code> - включить все\n` +
        `<code>/notifications all off</code> - выключить все\n\n` +
        `<b>Типы уведомлений:</b>\n` +
        `• <code>incoming</code> - входящие сообщения\n` +
        `• <code>outgoing</code> - статусы отправленных\n` +
        `• <code>state</code> - статус инстанса\n` +
        `• <code>all</code> - все типы`;
      
      await this.bot.send({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      });
      
      console.log("[COMMANDS.notifications] Current settings shown");
      return { status: "settings_shown" };
      
    } catch (error) {
      console.error("[COMMANDS.notifications] Error getting settings:", error);
      await this.bot.send({
        chat_id: chatId,
        text: "Ошибка при получении настроек уведомлений"
      });
      return { status: "error" };
    }
  }

  private async toggleNotification(
    chatId: string, 
    action: 'on' | 'off', 
    type: string
  ): Promise<{ status: string }> {
    try {
      const isEnable = action === 'on';

      let settings: any = {};
      let typeName = '';
      
      switch (type) {
        case 'incoming':
          settings.incomingWebhook = isEnable;
          typeName = "Входящие сообщения";
          break;
        case 'outgoing':
          settings.outgoingWebhook = isEnable;
          typeName = "Статусы отправленных сообщений";
          break;
        case 'status':
          settings.stateWebhook = isEnable;
          typeName = "Статус инстанса";
          break;
        case 'all':
          settings.incomingWebhook = isEnable;
          settings.outgoingWebhook = isEnable;
          settings.stateWebhook = isEnable;
          typeName = "Все уведомления";
          break;
        default:
          await this.bot.send({
            chat_id: chatId,
            text: `Неизвестный тип уведомления: "${type}"\n\nДоступные типы: incoming, outgoing, status`,
            parse_mode: "HTML"
          });
          return { status: "unknown_type" };
      }

      await this.storage.setNotificationSettings(chatId, settings);
      
      const actionText = isEnable ? "включены" : "выключены";
      
      const message = `<b>${typeName} ${actionText}</b>.\n\nПрименение настроек может занять до 5 минут.`;
      
      await this.bot.send({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      });
      
      console.log(`[COMMANDS.notifications] ${typeName} ${actionText}`);
      return { status: `notifications_${action}_${type}` };
      
    } catch (error) {
      console.error("[COMMANDS.notifications] Error updating settings:", error);
      await this.bot.send({
        chat_id: chatId,
        text: "Ошибка при обновлении настроек уведомлений"
      });
      return { status: "error" };
    }
  }
}