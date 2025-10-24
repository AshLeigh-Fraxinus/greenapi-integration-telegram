import { StorageProvider, Instance } from '@green-api/greenapi-integration';
import { TelegramUser } from './telegram-types';
import Database from 'better-sqlite3';

export class SQLiteStorage extends StorageProvider<TelegramUser> {

  private db: Database.Database;
  private users: Map<string, TelegramUser> = new Map();
  private instances: Map<number, Instance> = new Map();

  constructor(dbPath: string = 'storage.db') {
    super();
    this.db = new Database(dbPath);
    this.initDatabase();
    console.log('[Storage] Connected to SQLite database');
  }

  private initDatabase(): void {

    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL UNIQUE,
        user_name TEXT NOT NULL UNIQUE,
        first_name TEXT,
        language TEXT DEFAULT 'en',
        id_instance TEXT,
        apiTokenInstance TEXT,
        state TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
          UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_user_states_timestamp 
      AFTER UPDATE ON user_states
      FOR EACH ROW
      BEGIN
          UPDATE user_states SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);
  }

  async createInstance(instance: Instance, userId: bigint | number): Promise<Instance> {

    const chat_id = (instance as any).chat_id;
    const existingUserStmt = this.db.prepare(`SELECT * FROM users WHERE chat_id = ?`);
    const existingUser = existingUserStmt.get(chat_id) as any;

    let result;

    if (existingUser) {
      const updateStmt = this.db.prepare(`
        UPDATE users 
        SET user_name = ?, id_instance = ?, apiTokenInstance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = ?
      `);
      
      result = updateStmt.run(
        instance.name,
        instance.idInstance.toString(),
        instance.apiTokenInstance,
        chat_id
      );
    } else {
      const insertStmt = this.db.prepare(`
        INSERT INTO users (chat_id, user_name, id_instance, apiTokenInstance)
        VALUES (?, ?, ?, ?)
      `);

      result = insertStmt.run(
        chat_id,
        instance.name,
        instance.idInstance.toString(),
        instance.apiTokenInstance
      );
    }

    const newInstance: Instance = {
      ...instance,
      id: existingUser ? existingUser.id : Number(result.lastInsertRowid)
    };
    
    this.instances.set(newInstance.id, newInstance);
    return newInstance;
  }

  async getInstance(idInstance: number | bigint): Promise<Instance | null> {

    const cachedInstance = this.instances.get(Number(idInstance));
    if (cachedInstance) {
      return cachedInstance;
    }

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

    this.instances.set(instance.id, instance);
    return instance;
  }

  async removeInstance(instanceId: number | bigint): Promise<Instance> {

    const instance = this.instances.get(Number(instanceId));
    if (!instance) {
      throw new Error("Instance not found");
    }

    this.instances.delete(Number(instanceId));
    
    const stmt = this.db.prepare(`DELETE FROM users WHERE id_instance = ?`);
    stmt.run(instanceId.toString());
    return instance;
  }

  async updateUserInstance(chatId: string, idInstance: number, apiTokenInstance: string): Promise<void> {

    const stmt = this.db.prepare(`
      UPDATE users 
      SET id_instance = ?, apiTokenInstance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);

    stmt.run(
      idInstance.toString(),
      apiTokenInstance,
      chatId
    );

    const user = this.users.get(chatId);
    if (user) {
      user.idInstance = idInstance;
      user.apiTokenInstance = apiTokenInstance;
      user.updated_at = new Date();
    }
  }

  async findInstanceByChatId(telegramChatId: string): Promise<Instance | null> {

    const stmt = this.db.prepare(`
      SELECT * FROM users WHERE chat_id = ?
    `);
    
    const row = stmt.get(telegramChatId) as any;
    if (!row)
      return null;
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

    if (instance.id) {
      this.instances.set(instance.id, instance);
    }
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
      language: row.language,
      idInstance: row.id_instance ? parseInt(row.id_instance) : 0,
      apiTokenInstance: row.apiTokenInstance || '',
      state: undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };

  this.users.set(user.chat_id, user);
  return user;
}

  async createUser(data: Partial<TelegramUser>): Promise<TelegramUser> {

    const user: TelegramUser = {
      id: data.id || 0,
      chat_id: data.chat_id!,
      user_name: data.user_name!,
      first_name: data.first_name,
      language: data.language || 'en',
      idInstance: data.idInstance || 0,
      apiTokenInstance: data.apiTokenInstance || '',
      state: data.state,
      created_at: data.created_at || new Date(),
      updated_at: data.updated_at || new Date(),
    };

    const stmt = this.db.prepare(`
      INSERT INTO users (chat_id, user_name, first_name, language, id_instance, apiTokenInstance, state)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      user.chat_id,
      user.user_name,
      user.first_name || null,
      user.language,
      user.idInstance ? user.idInstance.toString() : null,
      user.apiTokenInstance || null,
      user.state || null
    );
    
    this.users.set(user.chat_id, user);
    return user;
  }

  async findUser(identifier: string): Promise<TelegramUser | null> {

    const cachedUser = this.users.get(identifier);
    if (cachedUser) {
      return cachedUser;
    }

    const stmt = this.db.prepare(`SELECT * FROM users WHERE chat_id = ?`);
    const row = stmt.get(identifier) as any;
    if (!row) return null;

    const user: TelegramUser = {
      id: row.id,
      chat_id: row.chat_id,
      user_name: row.user_name,
      first_name: row.first_name,
      language: row.language,
      idInstance: row.id_instance ? parseInt(row.id_instance) : 0,
      apiTokenInstance: row.apiTokenInstance || '',
      state: undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };

    this.users.set(identifier, user);
    return user;
  }

  async updateUser(identifier: string, data: Partial<TelegramUser>): Promise<TelegramUser> {

    const user = await this.findUser(identifier);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser: TelegramUser = { 
      ...user, 
      ...data,
      updated_at: new Date()
    };

    const stmt = this.db.prepare(`
      UPDATE users 
      SET user_name = ?, id_instance = ?, apiTokenInstance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `);

    stmt.run(
      updatedUser.user_name,
      updatedUser.idInstance ? updatedUser.idInstance.toString() : null,
      updatedUser.apiTokenInstance || null,
      identifier
    );

    this.users.set(identifier, updatedUser);
    return updatedUser;
  }

  async getInstancesByUserEmail(userEmail: string): Promise<Instance[]> {
    
    const stmt = this.db.prepare(`SELECT * FROM users WHERE user_name = ?`);
    const rows = stmt.all(userEmail) as any[];
    
    return rows.map(row => {
      const instance: Instance = {
        id: row.id,
        idInstance: parseInt(row.id_instance) || 0,
        apiTokenInstance: row.apiTokenInstance || '',
        name: row.user_name || '',
        token: row.apiTokenInstance || '',
        settings: {}
      };
      
      if (instance.id) {
        this.instances.set(instance.id, instance);
      }
      return instance;
    });
  }
}