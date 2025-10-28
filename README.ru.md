# Интеграция GREEN-API для Telegram

## Поддержка

[![Support](https://img.shields.io/badge/support@green--api.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:support@greenapi.com)
[![Support](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/greenapi_support_bot)
[![Support](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/77273122366)

## Руководства и новости

[![Guides](https://img.shields.io/badge/YouTube-%23FF0000.svg?style=for-the-badge&logo=YouTube&logoColor=white)](https://www.youtube.com/@green-api)
[![News](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/green_api)
[![News](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VaLj6J4LNSa2B5Jx6s3h)

[![NPM Version](https://img.shields.io/npm/v/@green-api/greenapi-integration)](https://www.npmjs.com/package/@green-api/whatsapp-chatbot-js-v2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

- [Documentation in English](README.md)

Эта интеграция обеспечивает взаимодействие с WhatsApp в Telegram через платформу GREEN-API. Разработана на базе [Universal Integration Platform](https://github.com/green-api/greenapi-integration) от GREEN-API и состоит из адаптера, который преобразует сообщения между Telegram и WhatsApp.

## Архитектура

### Адаптер Telegram

Приложение Express.js, которое:

- Обрабатывает преобразование сообщений между Telegram и WhatsApp     
- Управляет инстансами GREEN-API    
- Обрабатывает аутентификацию пользователей и выполнение команд 
- Предоставляет конечные точки для вебхуков обеих платформ  
- Использует SQLite для хранения данных пользователей и инстансов   

### Команды Telegram

Бот предоставляет следующие команды:

- `/start` - Начало работы с ботом      
- `/instance` [idInstance] [apiTokenInstance] - Привязка инстанса GREEN-API     
- `/resetInstance` - Перепривязка инстанса     
- `/status` или `/getStateInstance` - Проверка статуса инстанса     
- `/help` - Справка по командам     
- `/reply` или `/sendMessage` [номер WhatsApp] [текст] - Отправка сообщения в WhatsApp      
- `/me` - Информация о текущем пользователе 
- `/setpartnertoken` [token] - Установка партнерского токена  
- `/createinstance` - Создание нового инстанса  
- `/getinstances` - Получение списка инстансов  
- `/deleteinstance` [idInstance] - Удаление инстанса 

### Предварительные требования

- Node.js 16 или выше   
- Аккаунт и инстанс GREEN-API   
- Telegram бот (получить у @BotFather)  
- Доступный публичный URL для вебхуков (при развертывании на сервере)   

## Установка

### Локальная установка

1. Склонируйте или создайте проект:

```bash
mkdir telegram-greenapi-adapter
cd telegram-greenapi-adapter
```

2. Установите зависимости:

```bash
npm install
```

3. Настройте переменные окружения в файле .env:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
PORT=3000
WEBHOOK_URL= https://your-webhook-url/
```

4. Запустите приложение:

```bash
npm start
```

```bash
npm install @green-api/greenapi-integration
```

### Развертывание

#### Docker развертывание

Создайте Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

И docker-compose.yml:

```yaml
version: '3.8'
services:
  adapter:
    build: .
    ports:
      - "3000:3000"
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - PORT=3000
    volumes:
      - ./storage.db:/app/storage.db
```
Запуск:

```bash
docker-compose up -d
```

## Использование

1. Начало работы

Отправьте команду /start боту в Telegram для регистрации.

2. Привязка инстанса GREEN-API

```text
/instance [idInstance] [apiTokenInstance]
```

- idInstance: ID вашего инстанса GREEN-API  
- apiTokenInstance: API токен вашего инстанса GREEN-API 

Пример:

```text
/instance 1101111111 abcdef123456789abcdef123456789
```

3. Проверка статуса инстанса

```text
/status
```

или

```text
/getStateInstance
```

4. Ответ на сообщения WhatsApp

```text
/reply [номер WhatsApp] [текст сообщения]
```

или

```text
/sendMessage [номер WhatsApp] [текст сообщения]
```

5. Перепривязка инстанса

```text
/resetInstance
```

6. Справка

```text
/help
```

## Важные примечания

### Получение учетных данных GREEN-API

Для работы интеграции вам потребуется:

1. idInstance - ID вашего инстанса в GREEN-API  
2. apiTokenInstance - Токен доступа вашего инстанса 

Эти данные можно получить в личном кабинете GREEN-API после создания инстанса.

### Поддерживаемые типы сообщений

Интеграция поддерживает следующие типы сообщений WhatsApp:

- Текстовые сообщения   
- Изображения (с подписями)     
- Видео (с подписями)   
- Аудио (с подписями)   
- Документы (с подписями)   
- Локации   
- Контакты  
- Опросы    

### Хранение данных

Интеграция использует SQLite базу данных для хранения:

- Данных пользователей Telegram 
- Привязок к инстансам GREEN-API    
- Настроек и состояний  

Файл базы данных `storage.db` создается автоматически при первом запуске.

## Устранение неполадок

### Бот не отвечает на команды

1. Проверьте, что TELEGRAM_BOT_TOKEN установлен корректно   
2. Убедитесь, что вебхук Telegram настроен правильно    
3. Проверьте логи приложения на наличие ошибок  

### Сообщения не доставляются в WhatsApp

1. Проверьте статус инстанса командой /status   
2. Убедитесь, что инстанс авторизован в GREEN-API   
3. Проверьте настройки вебхуков в личном кабинете GREEN-API 

### Ошибки при отправке файлов

1. Убедитесь, что URL вашего адаптера доступен извне    
2. Проверьте размер файла (ограничения Telegram и GREEN-API)    
3. Убедитесь, что тип файла поддерживается  
