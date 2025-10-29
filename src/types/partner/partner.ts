export interface PartnerInstance {
  idInstance: number;
  name: string;
  typeInstance: string;
  typeAccount: string;
  partnerUserUiid: string;
  timeCreated: string;
  timeDeleted: string;
  apiTokenInstance: string;
  deleted: boolean;
  tariff: string;
  isFree: boolean;
  isPartner: boolean;
  expirationDate: string;
  isExpired: boolean;
}

export interface CreateInstanceResponse {
  idInstance: number;
  apiTokenInstance: string;
}

export interface PartnerInstanceList {
  data: PartnerInstanceList;
  instances: PartnerInstance[];
}