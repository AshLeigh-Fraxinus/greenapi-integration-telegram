import { StorageProvider, Instance } from '@green-api/greenapi-integration'
import { TelegramUser } from '../types/types';
import Database from 'better-sqlite3';

export class SQLiteStorage extends StorageProvider<TelegramUser> {
  private db: Database.Database;

  constructor(dbPath: string = 'storage.db') {
    super();
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL UNIQUE,
        user_name TEXT NOT NULL,
        first_name TEXT,
        id_instance TEXT,
        apiTokenInstance TEXT,
        incoming_webhook BOOLEAN DEFAULT 1,
        outgoing_webhook BOOLEAN DEFAULT 1,
        state_webhook BOOLEAN DEFAULT 1,
        partner_token TEXT,
        target_chat_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async createInstance(instance: Instance, userId: bigint | number): Promise<Instance> {
    console.log('[STORAGE] Adding Instance', instance, 'to database for user:', userId);
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET id_instance = ?, apiTokenInstance = ?, user_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);
    
    const result = stmt.run(
      instance.idInstance.toString(),
      instance.apiTokenInstance,
      instance.name,
      userId.toString() 
    );

    if (result.changes === 0) {
      throw new Error(`User with chat_id ${userId} not found`);
    }

    console.log('[STORAGE] Added Instance', instance.idInstance, 'to database for user:', userId);
    return {
      ...instance,
      id: Number(userId) 
    };
  }

  async getInstance(idInstance: number | bigint): Promise<Instance | null> {
    console.log('[STORAGE] Searching for Instance connected to', idInstance);
    const stmt = this.db.prepare(`SELECT * FROM users WHERE id_instance = ?`);
    const row = stmt.get(idInstance.toString()) as any;
    if (!row) return null;

    const instance: Instance = {
      id: row.id,
      idInstance: parseInt(row.id_instance) || Number(idInstance),
      apiTokenInstance: row.apiTokenInstance || '',
      name: row.user_name || '',
      token: row.apiTokenInstance || '',
      settings: {}
    };

    console.log('[STORAGE] Instance for', idInstance, 'found:', instance.idInstance);
    return instance;
  }

  async removeInstance(idInstance: number | bigint): Promise<Instance> {
    console.log('[STORAGE] Remove Instance', idInstance, 'from database');
    const instance = await this.getInstance(idInstance);
    if (!instance) {
      throw new Error("Instance not found");
    }
    
    const stmt = this.db.prepare(`DELETE FROM users WHERE id_instance = ?`);
    stmt.run(idInstance.toString());
    console.log('[STORAGE] Removed Instance', instance.idInstance, 'from database');
    return instance;
  }

  async findInstanceByChatId(telegramChatId: string): Promise<Instance | null> {
    console.log('[STORAGE] Searching Instance for', telegramChatId);
    const stmt = this.db.prepare(`SELECT * FROM users WHERE chat_id = ?`);
    
    const row = stmt.get(telegramChatId) as any;
    if (!row) return null;
    if (!row.id_instance || !row.apiTokenInstance) {
      return null;
    }

    const instance: Instance = {
      id: row.id,
      idInstance: parseInt(row.id_instance) || 0,
      apiTokenInstance: row.apiTokenInstance || '',
      name: row.user_name || '',
      token: row.apiTokenInstance || '',
      settings: {}
    };

    console.log('[STORAGE] Instance found for user', telegramChatId, ':', instance.idInstance);
    return instance;
  }

  async setNotificationSettings(chatId: string, settings: {
    incomingWebhook?: boolean;
    outgoingWebhook?: boolean;
    stateWebhook?: boolean;
  }): Promise<void> {
    console.log('[STORAGE] Setting notification settings for user:', chatId, settings);
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET 
        incoming_webhook = ?,
        outgoing_webhook = ?,
        state_webhook = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);
    
    const user = await this.findUser(chatId);
    if (!user) {
      throw new Error('User not found');
    }
    
      const incomingWebhook = settings.incomingWebhook !== undefined ? settings.incomingWebhook : true;
      const outgoingWebhook = settings.outgoingWebhook !== undefined ? settings.outgoingWebhook : true;
      const stateWebhook = settings.stateWebhook !== undefined ? settings.stateWebhook : true;
      
      const result = stmt.run(
        incomingWebhook ? 1 : 0,
        outgoingWebhook ? 1 : 0,
        stateWebhook ? 1 : 0,
        chatId
      );
    
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    console.log('[STORAGE] Notification settings updated for user:', chatId);
  }

  async getNotificationSettings(chatId: string): Promise<{
    incomingWebhook: boolean;
    outgoingWebhook: boolean;
    stateWebhook: boolean;
  }> {
    console.log('[STORAGE] Getting notification settings for user:', chatId);
    
    const stmt = this.db.prepare(`
      SELECT incoming_webhook, outgoing_webhook, state_webhook 
      FROM users 
      WHERE chat_id = ?
    `);
    
    const row = stmt.get(chatId) as any;
    if (!row) {
      throw new Error('User not found');
    }
    
    return {
      incomingWebhook: Boolean(row.incoming_webhook),
      outgoingWebhook: Boolean(row.outgoing_webhook),
      stateWebhook: Boolean(row.state_webhook)
    };
  }

  findUserByInstanceId(idInstance: number): TelegramUser | null {
    const stmt = this.db.prepare(`SELECT * FROM users WHERE id_instance = ?`);
    const row = stmt.get(idInstance.toString()) as any;
    if (!row) return null;

    const user: TelegramUser = {
      id: row.id,
      chat_id: row.chat_id,
      user_name: row.user_name,
      first_name: row.first_name,
      language: 'en', 
      idInstance: row.id_instance ? parseInt(row.id_instance) : 0,
      apiTokenInstance: row.apiTokenInstance || '',
      state: undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };

    console.log('[STORAGE] Instance', idInstance, 'is connected to user', user.user_name);
    return user;
  }

  async createUser(data: Partial<TelegramUser>): Promise<TelegramUser> {
    console.log('[STORAGE] Adding new user:', data);
    const stmt = this.db.prepare(`
      INSERT INTO users (chat_id, user_name, first_name, id_instance, apiTokenInstance, partner_token)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.chat_id!,
      data.user_name!,
      data.first_name || null,
      data.idInstance ? data.idInstance.toString() : null,
      data.apiTokenInstance || null,
      data.partner_token || null
    );

    const user: TelegramUser = {
      id: Number(result.lastInsertRowid),
      chat_id: data.chat_id!,
      user_name: data.user_name!,
      first_name: data.first_name,
      language: 'en',
      idInstance: data.idInstance || 0,
      apiTokenInstance: data.apiTokenInstance || '',
      partner_token: data.partner_token || '',
      state: undefined,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    console.log('[STORAGE] Added new User:', user.user_name);
    return user;
  }

  async findUser(identifier: string): Promise<TelegramUser | null> {
    console.log('[STORAGE] Searching for user', identifier);
    const stmt = this.db.prepare(`SELECT * FROM users WHERE chat_id = ?`);
    const row = stmt.get(identifier) as any;
    if (!row) return null;

    const user: TelegramUser = {
      id: row.id,
      chat_id: row.chat_id,
      user_name: row.user_name,
      first_name: row.first_name,
      language: 'en',
      idInstance: parseInt(row.id_instance),
      apiTokenInstance: row.apiTokenInstance || '',
      state: undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };

    console.log('[STORAGE] User', identifier, 'found:', user.user_name);
    return user;
  }

  async updateUser(identifier: string, data: Partial<TelegramUser>): Promise<TelegramUser> {
    console.log('[STORAGE] Searching for user', identifier);
    const user = await this.findUser(identifier);
    if (!user) {
      throw new Error('User not found');
    }

    const stmt = this.db.prepare(`
      UPDATE users 
      SET user_name = ?, first_name = ?, id_instance = ?, apiTokenInstance = ?, partner_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);
    
    const idInstanceValue = data.idInstance !== undefined 
    ? data.idInstance.toString() 
    : (user.idInstance ? user.idInstance.toString() : null);

    stmt.run(
      data.user_name || user.user_name,
      data.first_name || user.first_name,
      idInstanceValue,
      data.apiTokenInstance || user.apiTokenInstance,
      data.partner_token !== undefined ? data.partner_token : user.partner_token,
      identifier
    );

    console.log('[STORAGE] User updated:', user.user_name);

    const updatedUser: TelegramUser = { 
      ...user, 
      ...data,
      updated_at: new Date()
    };

    console.log('[STORAGE] User', user.user_name, 'updated');
    return updatedUser;
  }

  async setTargetChatId(chatId: string, targetChatId: string): Promise<void> {
    console.log('[STORAGE] Setting target chat_id for user:', chatId, '->', targetChatId);
    const stmt = this.db.prepare(`
      UPDATE users 
      SET target_chat_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);
    
    const result = stmt.run(targetChatId, chatId);
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    console.log('[STORAGE] Target chat_id set for user:', chatId);
  }

  async getTargetChatId(chatId: string): Promise<string | null> {
    console.log('[STORAGE] Getting target chat_id for user:', chatId);
    const stmt = this.db.prepare(`SELECT target_chat_id FROM users WHERE chat_id = ?`);
    const row = stmt.get(chatId) as any;
    return row?.target_chat_id || null;
  }

  async resetTargetChatId(chatId: string): Promise<void> {
    console.log('[STORAGE] Resetting target chat_id for user:', chatId);
    const stmt = this.db.prepare(`
      UPDATE users 
      SET target_chat_id = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);
    
    const result = stmt.run(chatId);
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    console.log('[STORAGE] Target chat_id reset for user:', chatId);
  }

  async setPartnerToken(chatId: string, partnerToken: string): Promise<void> {
    console.log('[STORAGE] Setting partner token for user:', chatId);
    const stmt = this.db.prepare(`
      UPDATE users 
      SET partner_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);
    
    const result = stmt.run(partnerToken, chatId);
    if (result.changes === 0) {
      throw new Error('User not found');
    }
    console.log('[STORAGE] Partner token set for user:', chatId);
  }

  async getPartnerToken(chatId: string): Promise<string | null> {
    console.log('[STORAGE] Getting partner token for user:', chatId);
    const stmt = this.db.prepare(`SELECT partner_token FROM users WHERE chat_id = ?`);
    const row = stmt.get(chatId) as any;
    return row?.partner_token || null;
  }

}