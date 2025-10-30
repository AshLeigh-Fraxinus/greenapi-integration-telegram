interface LocalizationMessages {
  [key: string]: string;
}

interface LocalizationDictionary {
  [language: string]: LocalizationMessages;
}

export class Localization {
  private static messages: LocalizationDictionary = {
    'ru': {
      // Общие сообщения
      'welcome': 'Добро пожаловать в WhatsApp-мост!',
      'bot_ready': 'Бот настроен и готов к работе!',
      'use_help': 'Для получения списка доступных команд отправьте /help',
      'send_messages': 'Отправляйте сообщения, и они будут пересылаться в WhatsApp.',
      'error_occurred': 'Произошла ошибка.',
      'invalid_format': 'Неверный формат.',
      'unknown_command': 'Неизвестная команда.',
      'user_not_found': 'Пользователь не найден',
      'no_instance': 'Инстанс не привязан.',
      'instance_linked': 'Инстанс успешно привязан!',
      'webhook_auto_set': 'Вебхук автоматически установлен.',
      'webhook_manual_required': 'Не удалось установить вебхук автоматически.',
      'instance_reset': 'Привязка инстанса сброшена.',
      'settings_reset': 'Настройки сброшены!',
      'settings_updated': 'Настройки обновлены!',
      'message_sent': 'Сообщение отправлено',
      'status_checked': 'Статус проверен',
      'partner_token_saved': 'Partner token успешно сохранен!',
      'instance_created': 'Инстанс успешно создан!',
      'instance_deleted': 'Инстанс успешно удален!',
      'instances_listed': 'Список инстансов показан',

      // Ошибки
      'error_saving_token': 'Ошибка при сохранении partner token.',
      'error_creating_instance': 'Ошибка при создании инстанса.',
      'error_deleting_instance': 'Ошибка при удалении инстанса.',
      'error_getting_instances': 'Ошибка при получении списка инстансов.',
      'error_sending_message': 'Ошибка при отправке сообщения.',
      'error_checking_status': 'Ошибка при проверке статуса инстанса',
      'error_reset_instance': 'Ошибка при сбросе инстанса',
      'error_reset_chat': 'Ошибка при сбросе настроек пересылки',
      'error_set_chat': 'Ошибка при настройке пересылки',
      'error_getting_info': 'Ошибка при получении информации',
      'error_updating_notifications': 'Ошибка при обновлении настроек уведомлений',
      'error_getting_notifications': 'Ошибка при получении настроек уведомлений',

      // Конкретные сообщения
      'missing_token': 'Пожалуйста, укажите partner token.',
      'no_partner_token': 'Сначала установите partner token.\n\nКоманда: <code>/setpartnertoken &lt;token&gt;</code>',
      'missing_instance_id': 'Пожалуйста, укажите ID инстанса.',
      'invalid_instance_id': 'ID инстанса должен быть числом.',
      'invalid_chat_id': 'Неверный формат chat_id.',
      'invalid_action': 'Неправильное действие.',
      'unknown_type': 'Неизвестный тип уведомления.',
      'no_instances': 'У вас нет созданных инстансов.',
      'no_active_instances': 'У вас нет активных инстансов.',
      'instance_already_linked': 'Этот инстанс уже привязан к другому пользователю Telegram.',

      // Network errors
      'network_error': 'Ошибка сети: Не удается подключиться к сервису Green API.',
      'unauthorized': 'Неверный partner token.',
      'not_found': 'Инстанс не найден.',
    },
    'en': {
      // General messages
      'welcome': 'Welcome to WhatsApp Bridge!',
      'bot_ready': 'Bot is configured and ready to work!',
      'use_help': 'Send /help for list of available commands',
      'send_messages': 'Send messages and they will be forwarded to WhatsApp.',
      'error_occurred': 'An error occurred.',
      'invalid_format': 'Invalid format.',
      'unknown_command': 'Unknown command.',
      'user_not_found': 'User not found',
      'no_instance': 'Instance not linked.',
      'instance_linked': 'Instance successfully linked!',
      'webhook_auto_set': 'Webhook automatically set.',
      'webhook_manual_required': 'Failed to set webhook automatically.',
      'instance_reset': 'Instance binding reset.',
      'settings_reset': 'Settings reset!',
      'settings_updated': 'Settings updated!',
      'message_sent': 'Message sent',
      'status_checked': 'Status checked',
      'partner_token_saved': 'Partner token successfully saved!',
      'instance_created': 'Instance successfully created!',
      'instance_deleted': 'Instance successfully deleted!',
      'instances_listed': 'Instances list shown',

      // Errors
      'error_saving_token': 'Error saving partner token.',
      'error_creating_instance': 'Error creating instance.',
      'error_deleting_instance': 'Error deleting instance.',
      'error_getting_instances': 'Error getting instances list.',
      'error_sending_message': 'Error sending message.',
      'error_checking_status': 'Error checking instance status',
      'error_reset_instance': 'Error resetting instance',
      'error_reset_chat': 'Error resetting forwarding settings',
      'error_set_chat': 'Error setting up forwarding',
      'error_getting_info': 'Error getting information',
      'error_updating_notifications': 'Error updating notification settings',
      'error_getting_notifications': 'Error getting notification settings',

      // Specific messages
      'missing_token': 'Please specify partner token.',
      'no_partner_token': 'Please set partner token first.\n\nCommand: <code>/setpartnertoken &lt;token&gt;</code>',
      'missing_instance_id': 'Please specify instance ID.',
      'invalid_instance_id': 'Instance ID must be a number.',
      'invalid_chat_id': 'Invalid chat_id format.',
      'invalid_action': 'Invalid action.',
      'unknown_type': 'Unknown notification type.',
      'no_instances': 'You have no created instances.',
      'no_active_instances': 'You have no active instances.',
      'instance_already_linked': 'This instance is already linked to another Telegram user.',

      // Network errors
      'network_error': 'Network error: Cannot connect to Green API service.',
      'unauthorized': 'Invalid partner token.',
      'not_found': 'Instance not found.',
    }
  };

  static getMessage(key: string, language: string = 'en'): string {
    const lang = (language === 'ru' || language === 'kz') ? 'ru' : 'en';
    const langMessages = this.messages[lang];
    const defaultMessages = this.messages['en'];
    
    return langMessages[key as keyof typeof langMessages] || 
           defaultMessages[key as keyof typeof defaultMessages] || 
           key;
  }

  static getHelpText(language: string = 'en'): string {
    if (language === 'ru' || language === 'kz') {
      return `
<b>Мост WhatsApp → Telegram</b>

Добро пожаловать в бота-пересыльщика сообщений!

---
<b>Сервисные команды:</b>
• /start — Начать работу с ботом
• /me — Показать информацию о пользователе
• /language — Сменить язык

<b>Управление инстансом:</b>
• <code>/instance &lt;id&gt; &lt;token&gt;</code> — Привязать инстанс Green API
• /status — Проверить статус инстанса
• /resetInstance — Сменить привязанный инстанс
• <code>/notifications &lt;type&gt; &lt;on|off&gt;</code> - Управление уведомлениями (получение входящих (<code>incoming</code>) сообщений, статусов отправленных сообщений (<code>outgoing</code>) и статуса инстанса(<code>status</code>))

<b>Команды WhatsApp:</b>
• <code>/reply &lt;chatId&gt; &lt;message&gt;</code> — Отправить сообщение в чат WhatsApp

<b>Настройки пересылки</b>
• <code>/setchat &lt;chat_id&gt;</code> — Настроить пересылку в другой телеграм чат
• /resetchat — Сбросить настройки пересылки (получать в этот чат)

<b>Управление инстансами (партнёрские методы):</b>
• <code>/setpartnertoken &lt;token&gt;</code> — Установить токен партнёра
• /createinstance — Создать новый инстанс
• /getinstances — Показать все инстансы
• <code>/deleteinstance &lt;instance_id&gt;</code> — Удалить инстанс

---
Для начала работы привяжите свой инстанс Green API.
`;
    } else {
      return `
<b>WhatsApp → Telegram Bridge</b>

Welcome to the message forwarding bot!

---
<b>Service commands:</b>
• /start — Start working with the bot
• /me — Show user information
• /language — Change language

<b>Instance management:</b>
• <code>/instance &lt;id&gt; &lt;token&gt;</code> — Link Green API instance
• /status — Check instance status
• /resetInstance — Change linked instance
• <code>/notifications &lt;type&gt; &lt;on|off&gt;</code> - Managing notifications (receiving incoming (<code>incoming</code>) messages, sent message statuses (<code>outgoing</code>) and instance status (<code>status</code>))

<b>WhatsApp commands:</b>
• <code>/reply &lt;chatId&gt; &lt;message&gt;</code> — Send message to WhatsApp chat

<b>Forwarding settings</b>
• <code>/setchat &lt;chat_id&gt;</code> — Configure forwarding to another telegram chat
• /resetchat — Reset forwarding settings (receive in this chat)

<b>Instance management (partner methods):</b>
• <code>/setpartnertoken &lt;token&gt;</code> — Set partner token
• /createinstance — Create new instance
• /getinstances — Show all instances
• <code>/deleteinstance &lt;instance_id&gt;</code> — Delete instance

---
To get started, link your Green API instance.
`;
    }
  }

  static getStartText(language: string = 'en'): string {
    if (language === 'ru' || language === 'kz') {
      return `<b>Добро пожаловать в WhatsApp-мост!</b>

<b>Пошаговая инструкция для начала работы:</b>

1️. <b>Получите инстанс в Green API</b>
   • Зарегистрируйтесь на console.green-api.com
   • Создайте инстанс в личном кабинете
   • Скопируйте idInstance и apiTokenInstance

2. <b>Настройте WhatsApp</b>
   • Откройте привязанный инстанс в Green API
   • Отсканируйте QR-код в настройках инстанса
   • Дождитесь статуса "authorized"

3. <b>Привяжите инстанс</b>
   • Отправьте команду:
     <code>/instance 1101111111 abc123abc123abc123abc123abc123</code>

4️. <b>Проверьте статус</b>
   • Используйте команду: /status

5️. <b>Начните работу</b>
   • Отправляйте сообщения в этот чат для пересылки в WhatsApp
   • Используйте /reply для ответов на сообщения

<b>Дополнительные возможности:</b>
   • <code>/setchat &lt;chat_id&gt;</code> — пересылать сообщения в другой чат
   • /help — все команды

<b>Начните с привязки инстанса!</b>`;
    } else {
      return `<b>Welcome to WhatsApp Bridge!</b>

<b>Step-by-step setup guide:</b>

1️. <b>Get instance in Green API</b>
   • Register at console.green-api.com
   • Create instance in personal account
   • Copy idInstance and apiTokenInstance

2. <b>Setup WhatsApp</b>
   • Open linked instance in Green API
   • Scan QR code in instance settings
   • Wait for "authorized" status

3. <b>Link instance</b>
   • Send command:
     <code>/instance 1101111111 abc123abc123abc123abc123abc123</code>

4️. <b>Check status</b>
   • Use command: /status

5️. <b>Start working</b>
   • Send messages to this chat to forward to WhatsApp
   • Use /reply to reply to messages

<b>Additional features:</b>
   • <code>/setchat &lt;chat_id&gt;</code> — forward messages to another chat
   • /help — all commands

<b>Start by linking your instance!</b>`;
    }
  }

  static getInstanceFormatText(language: string = 'en'): string {
    if (language === 'ru' || language === 'kz') {
      return "Неверный формат. Используйте:\n/instance 1101111111 abc123abc123abc123abc123abc123\n\nГде:\n• 1101111111 - idInstance\n• abc123... - apiTokenInstance";
    } else {
      return "Invalid format. Use:\n/instance 1101111111 abc123abc123abc123abc123abc123\n\nWhere:\n• 1101111111 - idInstance\n• abc123... - apiTokenInstance";
    }
  }

  static getInstanceSuccessText(language: string = 'en', webhookUrl?: string): string {
    const baseText = language === 'ru' || language === 'kz' 
      ? "Инстанс успешно привязан!\n\n" 
      : "Instance successfully linked!\n\n";

    const webhookText = webhookUrl 
      ? (language === 'ru' || language === 'kz' 
          ? "Вебхук автоматически установлен.\n\n" 
          : "Webhook automatically set.\n\n")
      : (language === 'ru' || language === 'kz'
          ? `Не удалось установить вебхук автоматически. Пожалуйста, установите его вручную в настройках Green API:\nURL: ${webhookUrl}/webhook/whatsapp\n\n`
          : `Failed to set webhook automatically. Please set it manually in Green API settings:\nURL: ${webhookUrl}/webhook/whatsapp\n\n`);

    const footerText = language === 'ru' || language === 'kz'
      ? "Теперь вы можете получать и отправлять сообщения через WhatsApp.\n\nДоступные команды:\n• /status - статус инстанса\n• /resetInstance - сменить инстанс\n• /help - помощь"
      : "Now you can receive and send messages via WhatsApp.\n\nAvailable commands:\n• /status - instance status\n• /resetInstance - change instance\n• /help - help";

    return baseText + webhookText + footerText;
  }

  static getMeText(language: string = 'en', user: any, targetChatId?: string | null): string {
    const notSpecified = language === 'ru' || language === 'kz' ? 'не указан' : 'not specified';
    
    if (language === 'ru' || language === 'kz') {
      return `<b>Ваша информация</b>\n\n` +
        `<b>Ваш Telegram ID:</b> <code>${user.chat_id}</code>\n` +
        `<b>Username:</b> ${user.user_name || notSpecified}\n` +
        `<b>Имя:</b> ${user.first_name || notSpecified}\n\n` +
        `<b>Пересылка сообщений:</b>\n` +
        (targetChatId 
          ? `В чат <code>${targetChatId}</code>`
          : `В этот чат`);
    } else {
      return `<b>Your Information</b>\n\n` +
        `<b>Your Telegram ID:</b> <code>${user.chat_id}</code>\n` +
        `<b>Username:</b> ${user.user_name || notSpecified}\n` +
        `<b>First Name:</b> ${user.first_name || notSpecified}\n\n` +
        `<b>Message forwarding:</b>\n` +
        (targetChatId 
          ? `To chat <code>${targetChatId}</code>`
          : `To this chat`);
    }
  }

  static getLanguageText(language: string = 'en'): string {
    if (language === 'ru' || language === 'kz') {
      return `Текущий язык: ${language}\n\nДоступные языки:\n• <code>/language ru</code> - Русский\n• <code>/language en</code> - English`;
    } else {
      return `Current language: ${language}\n\nAvailable languages:\n• <code>/language ru</code> - Russian\n• <code>/language en</code> - English`;
    }
  }

  static getLanguageChangedText(language: string): string {
    return language === 'ru' ? 'Язык изменен на русский' : 'Language changed to English';
  }
}