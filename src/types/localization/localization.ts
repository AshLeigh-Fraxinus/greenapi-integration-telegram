export interface LocalizationMessages {
  [key: string]: string;
}

export interface LocalizationDictionary {
  [language: string]: LocalizationMessages;
}