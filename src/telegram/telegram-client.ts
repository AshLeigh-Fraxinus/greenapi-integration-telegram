import { IntegrationError } from "@green-api/greenapi-integration";
import axios from "axios";
import { 
  TelegramSendMessage, 
  TelegramSendPhoto, 
  TelegramSendDocument,
  TelegramSendLocation,
  TelegramSendContact,
  TelegramSendVideo,
  TelegramSendAudio,
  TelegramSendPoll
} from "./telegram-types";

export class TelegramBot {

  constructor(private botToken: string) {}

  async sendMessage(message: TelegramSendMessage): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, message);
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram message: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async sendPhoto(photo: TelegramSendPhoto): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, photo);
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram photo: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async sendVideo(video: TelegramSendVideo): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendVideo`, video);
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram video: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async sendAudio(audio: TelegramSendAudio): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendAudio`, audio);
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram video: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async sendDocument(document: TelegramSendDocument): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendDocument`, document);
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram document: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async sendPoll(poll: TelegramSendPoll): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendPoll`, poll );
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram document: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async sendLocation(location: TelegramSendLocation): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendLocation`, location);
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram location: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async sendContact(contact: TelegramSendContact): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendContact`, contact);
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram contact: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async setWebhook(url: string): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/setWebhook`, { url });
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to set Telegram webhook: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  async getWebhookInfo(): Promise<any> {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`);
      return response.data;
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to get Telegram webhook info: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

}
