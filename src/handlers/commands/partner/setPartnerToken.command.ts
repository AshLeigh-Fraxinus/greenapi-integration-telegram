import { TelegramBot } from "../../../client/telegram.client";
import { SQLiteStorage } from "../../../core/storage";

export class SetPartnerTokenCommand {
  constructor(
    private storage: SQLiteStorage,
    private bot: TelegramBot
  ) {}
  
    async execute(messageText: string, chatId: string) {
    try {
        const token = messageText.split(' ')[1];
        if (!token) {
        await this.bot.send({
        chat_id: chatId,
        text: "Пожалуйста, укажите partner token.\n\nДля этого отправьте команду: <code>/setpartnertoken &lt;token&gt;</code>",
        parse_mode: "HTML"}
        );
        return { status: "missing_token" };
        }

        await this.storage.setPartnerToken(chatId, token);
        await this.bot.send({
        chat_id: chatId,
        text: "Partner token успешно сохранен!"
        });
        return { status: "partner_token_saved" };

    } catch (error) {
        console.error("[HANDLER] Failed to set partner token:", error);
        await this.bot.send({
        chat_id: chatId,
        text: "Ошибка при сохранении partner token."
    });

        return { status: "error", error: "Failed to set partner token" };
    }
  }
}