import { SQLiteStorage } from "../storage/storage";

export abstract class BaseTransformer {
  constructor(protected storage: SQLiteStorage) {}

  protected extractPhoneNumber(vcard: string, language: string = 'en'): string {
    if (!vcard) return language === 'ru' || language === 'kz' ? 'Номер не найден' : 'Number not found';
    
    try {
      const telLine = vcard.split('\n').find(line => line.startsWith('TEL'));
      if (!telLine) return language === 'ru' || language === 'kz' ? 'Номер не найден' : 'Number not found';

      const telParts = telLine.split(':');
      if (telParts.length < 2) return language === 'ru' || language === 'kz' ? 'Номер не найден' : 'Number not found';

      let phoneNumber = telParts[1].trim();
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      return phoneNumber || (language === 'ru' || language === 'kz' ? 'Номер не найден' : 'Number not found');
    } catch (error) {
      console.error('Error extracting phone number from vcard:', error);
      return language === 'ru' || language === 'kz' ? 'Ошибка извлечения номера' : 'Error extracting number';
    }
  }
}