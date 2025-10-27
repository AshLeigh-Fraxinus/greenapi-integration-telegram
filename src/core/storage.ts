import { StorageProvider, Instance } from '@green-api/greenapi-integration';
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async createInstance(instance: Instance, userId: bigint | number): Promise<Instance> {
    console.log('[STORAGE] Adding Instance', instance, 'to database');
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (chat_id, user_name, id_instance, apiTokenInstance)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      (instance as any).chat_id,
      instance.name,
      instance.idInstance.toString(),
      instance.apiTokenInstance
    );

    console.log('[STORAGE] Added Instance', instance.idInstance, 'to database');
    return {
      ...instance,
      id: Number(result.lastInsertRowid)
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

  async removeInstance(instanceId: number | bigint): Promise<Instance> {
    console.log('[STORAGE] Remove Instance', instanceId, 'from database');
    const instance = await this.getInstance(instanceId);
    if (!instance) {
      throw new Error("Instance not found");
    }
    
    const stmt = this.db.prepare(`DELETE FROM users WHERE id_instance = ?`);
    stmt.run(instanceId.toString());
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

  async findUserByInstanceId(idInstance: number): Promise<TelegramUser | null> {
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
      INSERT INTO users (chat_id, user_name, first_name, id_instance, apiTokenInstance)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.chat_id!,
      data.user_name!,
      data.first_name || null,
      data.idInstance ? data.idInstance.toString() : null,
      data.apiTokenInstance || null
    );

    const user: TelegramUser = {
      id: Number(result.lastInsertRowid),
      chat_id: data.chat_id!,
      user_name: data.user_name!,
      first_name: data.first_name,
      language: 'en',
      idInstance: data.idInstance || 0,
      apiTokenInstance: data.apiTokenInstance || '',
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
      idInstance: row.id_instance ? parseInt(row.id_instance) : 0,
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
      SET user_name = ?, first_name = ?, id_instance = ?, apiTokenInstance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);

    stmt.run(
      data.user_name || user.user_name,
      data.first_name || user.first_name,
      data.idInstance ? data.idInstance.toString() : user.idInstance.toString(),
      data.apiTokenInstance || user.apiTokenInstance,
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

}