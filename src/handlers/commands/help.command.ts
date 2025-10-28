import { TelegramBot } from "../../client/telegram.client";

export class HelpCommand {
  constructor(private bot: TelegramBot) {}

  async execute(chatId: string): Promise<{ status: string }> {
    console.log("[COMMANDS.help] Handling command")
    const helpText = `
<b>Мост WhatsApp → Telegram</b>

Добро пожаловать в бота-пересыльщика сообщений!

---
<b>Сервисные команды:</b>
• /start — Начать работу с ботом
• /me — Показать информацию о пользователе

<b>Управление инстансом:</b>
• <code>/instance &lt;id&gt; &lt;token&gt;</code> — Привязать инстанс Green API
• /status — Проверить статус инстанса
• /resetInstance — Сменить привязанный инстанс

<b>Команды WhatsApp:</b>
• <code>/reply &lt;chatId&gt; &lt;message&gt;</code> — Отправить сообщение в чат WhatsApp

<b>Настройки пересылки</b>
• <code>/setchat &lt;chat_id&gt;</code> — Настроить пересылку в другой чат
• /resetchat — Сбросить настройки пересылки (получать в этот чат)

<b>Управление инстансами (партнёрские методы):</b>
• <code>/setpartnertoken &lt;token&gt;</code> — Установить токен партнёра
• /createinstance — Создать новый инстанс
• /getinstances — Показать все инстансы
• <code>/deleteinstance &lt;instance_id&gt;</code> — Удалить инстанс

---
Для начала работы привяжите свой инстанс Green API.
`;
    await this.bot.send({
      chat_id: chatId,
      text: helpText,
      parse_mode: "HTML"
    });
    console.log("[COMMANDS.help] Help message sent")
    return { status: "help_shown" };
  }
}