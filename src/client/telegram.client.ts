import { IntegrationError } from "@green-api/greenapi-integration";
import { TelegramPlatformMessage } from "../types/types";
import axios from "axios";

export class TelegramBot {
  constructor(private botToken: string) {}

  async send(message: TelegramPlatformMessage): Promise<void> {
    try {
      if ('text' in message) {
        await this.sendMessage(message);
      } else if ('photo' in message) {
        await this.sendPhoto(message);
      } else if ('video' in message) {
        await this.sendVideo(message);
      } else if ('audio' in message) {
        await this.sendAudio(message);
      } else if ('document' in message) {
        await this.sendDocument(message);
      } else if ('latitude' in message && 'longitude' in message) {
        await this.sendLocation(message);
      } else if ('phone_number' in message) {
        await this.sendContact(message);
      } else if ('question' in message) {
        await this.sendPoll(message);
      } else {
        throw new IntegrationError(
          "Unsupported Telegram message type",
          "UNSUPPORTED_MESSAGE_TYPE",
          400
        );
      }
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to send Telegram message: ${error.response?.data?.description || error.message}`,
        "TELEGRAM_API_ERROR",
        error.response?.status || 500
      );
    }
  }

  private async sendMessage(message: any): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, message);
  }

  private async sendPhoto(photo: any): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, photo);
  }

  private async sendVideo(video: any): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendVideo`, video);
  }

  private async sendAudio(audio: any): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendAudio`, audio);
  }

  private async sendDocument(document: any): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendDocument`, document);
  }

  private async sendPoll(poll: any): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendPoll`, poll);
  }

  private async sendLocation(location: any): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendLocation`, location);
  }

  private async sendContact(contact: any): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendContact`, contact);
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