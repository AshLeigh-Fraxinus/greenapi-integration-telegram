import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../storage/storage";
import { Localization } from "../../../utils/localization";

export class NotificationsCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}

  async execute(messageText: string, chatId: string, language: string = 'en'): Promise<{ status: string }> {
    console.log("[COMMANDS.notifications] Handling command with args:", messageText);

    const args = messageText.split(' ').slice(1);

    if (args.length === 0) {
      return await this.showCurrentSettings(chatId, language);
    }

    if (args.length !== 2) {
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('invalid_format', language),
        parse_mode: "HTML"
      });
      return { status: "invalid_format" };
    }

    const action = args[0].toLowerCase();
    const type = args[1].toLowerCase();

    if (action !== 'on' && action !== 'off') {
      await this.bot.send({
        chat_id: chatId,
        text: Localization.getMessage('invalid_action', language),
        parse_mode: "HTML"
      });
      return { status: "invalid_action" };
    }

    return await this.toggleNotification(chatId, action, type, language);
  }

  private async showCurrentSettings(chatId: string, language: string): Promise<{ status: string }> {
    try {
      const settings = await this.storage.getNotificationSettings(chatId);
      
      const statusText = (enabled: boolean) => enabled ? 
        (language === 'ru' || language === 'kz' ? "включена" : "enabled") : 
        (language === 'ru' || language === 'kz' ? "выключена" : "disabled");
      
      const message = language === 'ru' || language === 'kz' ? 
        `<b>Настройки уведомлений</b>\n\n` +
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
        `• <code>all</code> - все типы` :
        `<b>Notifications Settings</b>\n\n` +
        `<b>Incoming messages</b>: ${statusText(settings.incomingWebhook)}\n` +
        `<b>Outgoing statuses</b>: ${statusText(settings.outgoingWebhook)}\n` +
        `<b>Instance status</b>: ${statusText(settings.stateWebhook)}\n\n` +
        `<b>Usage:</b>\n` +
        `<code>/notifications on incoming</code> - enable incoming\n` +
        `<code>/notifications off state</code> - disable status\n` +
        `<code>/notifications all on</code> - enable all\n` +
        `<code>/notifications all off</code> - disable all\n\n` +
        `<b>Notification types:</b>\n` +
        `• <code>incoming</code> - incoming messages\n` +
        `• <code>outgoing</code> - outgoing statuses\n` +
        `• <code>state</code> - instance status\n` +
        `• <code>all</code> - all types`;
      
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
        text: Localization.getMessage('error_getting_notifications', language)
      });
      return { status: "error" };
    }
  }

  private async toggleNotification(
    chatId: string, 
    action: 'on' | 'off', 
    type: string,
    language: string
  ): Promise<{ status: string }> {
    try {
      const isEnable = action === 'on';

      let settings: any = {};
      let typeName = '';
      
      switch (type) {
        case 'incoming':
          settings.incomingWebhook = isEnable;
          typeName = language === 'ru' || language === 'kz' ? "Входящие сообщения" : "Incoming messages";
          break;
        case 'outgoing':
          settings.outgoingWebhook = isEnable;
          typeName = language === 'ru' || language === 'kz' ? "Статусы отправленных сообщений" : "Outgoing message statuses";
          break;
        case 'status':
          settings.stateWebhook = isEnable;
          typeName = language === 'ru' || language === 'kz' ? "Статус инстанса" : "Instance status";
          break;
        case 'all':
          settings.incomingWebhook = isEnable;
          settings.outgoingWebhook = isEnable;
          settings.stateWebhook = isEnable;
          typeName = language === 'ru' || language === 'kz' ? "Все уведомления" : "All notifications";
          break;
        default:
          await this.bot.send({
            chat_id: chatId,
            text: Localization.getMessage('unknown_type', language),
            parse_mode: "HTML"
          });
          return { status: "unknown_type" };
      }

      await this.storage.setNotificationSettings(chatId, settings);
      
      const actionText = isEnable ? 
        (language === 'ru' || language === 'kz' ? "включены" : "enabled") : 
        (language === 'ru' || language === 'kz' ? "выключены" : "disabled");
      
      const applyText = language === 'ru' || language === 'kz' ? 
        "Применение настроек может занять до 5 минут." : 
        "Settings application may take up to 5 minutes.";
      
      const message = `<b>${typeName} ${actionText}</b>.\n\n${applyText}`;
      
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
        text: Localization.getMessage('error_updating_notifications', language)
      });
      return { status: "error" };
    }
  }
}