import { IntegrationError } from "@green-api/greenapi-integration";
import axios, { AxiosInstance } from "axios";
import { CreateInstanceResponse, PartnerInstance, PartnerInstanceList } from "../types/";

export class PartnerApiClient {
  private client: AxiosInstance;

  constructor(private partnerToken: string) {
    this.client = axios.create({
      baseURL: 'https://api.green-api.com/partner/',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createInstance(): Promise<CreateInstanceResponse> {
    try {
      const response = await this.client.post<CreateInstanceResponse>(
        `/createInstance/${this.partnerToken}`,
      );
      return response.data;
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to create instance: ${error.response?.data?.message || error.message}`,
        "PARTNER_API_ERROR",
        error.response?.status || 500
      );
    }
  }

 async getInstances(): Promise<PartnerInstance[]> {
    try {
      const response = await this.client.get<PartnerInstance[]>(
        `/getInstances/${this.partnerToken}`
      );

      console.log('[PartnerApiClient] Number of instances received:', response.data.length);
      return response.data;

    } catch (error: any) {
      console.error('[PartnerApiClient] Failed to get instances:', error);
      
      if (error.response?.status === 401) {
        throw new IntegrationError('Unauthorized - invalid partner token', 'UNAUTHORIZED', 401);
      }
      
      if (error.code === 'ENOTFOUND' || error.message?.includes('Network Error')) {
        throw new IntegrationError(
          'Network error: Cannot connect to Green API partner service. Check your internet connection.',
          'NETWORK_ERROR',
          503
        );
      }
      
      throw new IntegrationError(
        `Failed to get instances: ${error.response?.data?.message || error.message}`,
        'PARTNER_API_ERROR',
        error.response?.status || 500
      );
    }
  }

  async deleteInstanceAccount(instanceId: number): Promise<void> {
    try {
      await this.client.post(
        `/deleteInstanceAccount/${this.partnerToken}`, { "idInstance": instanceId }
      );
    } catch (error: any) {
      throw new IntegrationError(
        `Failed to delete instance: ${error.response?.data?.message || error.message}`,
        "PARTNER_API_ERROR",
        error.response?.status || 500
      );
    }
  }
}