# GREEN-API Integration for Telegram

## Support

[![Support](https://img.shields.io/badge/support@green--api.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:support@greenapi.com)
[![Support](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/greenapi_support_bot)
[![Support](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/77273122366)

## Guides and News

[![Guides](https://img.shields.io/badge/YouTube-%23FF0000.svg?style=for-the-badge&logo=YouTube&logoColor=white)](https://www.youtube.com/@green-api)
[![News](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/green_api)
[![News](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VaLj6J4LNSa2B5Jx6s3h)

[![NPM Version](https://img.shields.io/npm/v/@green-api/greenapi-integration)](https://www.npmjs.com/package/@green-api/whatsapp-chatbot-js-v2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

- [Документация на русском языке](README.ru.md)

This integration enables interaction with WhatsApp in Telegram through the GREEN-API platform. It is built on the [Universal Integration Platform](https://github.com/green-api/greenapi-integration) from GREEN-API and consists of an adapter that converts messages between Telegram and WhatsApp.

## Architecture

### Components

- **TelegramAdapter** - Express.js application that handles message conversion between Telegram and WhatsApp    
- **TelegramHandler** - Processes Telegram commands and user interactions   
- **TelegramTransformer** - Transforms messages between platforms   
- **PartnerApiClient** - Client for working with GREEN-API Partner API  
- **Localization** - Multi-language support system (English/Russian)  
- **SQLiteStorage** - Database for storing user data and instances  

### Telegram commands

The bot provides the following commands:

- `/help` - Command reference
- `/start` - Start working with the bot
- `/me` - Information about current user
- `/instance` [idInstance] [apiTokenInstance] - Connect GREEN-API instance
- `/resetInstance` - Reconnect instance
- `/status` or `/getStateInstance` - Check instance status
- `/notifications` - Manage notifications
- `/reply` or `/sendMessage` [WhatsApp number] [text] - Send message to WhatsApp
- `/setpartnertoken` [token] - Set partner token
- `/createinstance` - Create new instance
- `/getinstances` - Get list of instances
- `/deleteinstance` [idInstance] - Delete instance
- `/language` or `/lang` - Change language

### Features

- Multi-language support (English/Russian)    
- Notification management   
- Partner API integration   
- Instance management via bot   
- Webhook handling for both platforms   
- SQLite database for data persistence    

### Prerequisites

- .js 18 or higher  
- GREEN-API account and instance    
- Telegram bot (get from @BotFather)    
- Publicly accessible URL for webhooks (when deploying on server)   

## Installation

### Local Installation

1. Clone or create the project:

```bash
mkdir telegram-greenapi-adapter
cd telegram-greenapi-adapter
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in .env file:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
PORT=3000
WEBHOOK_URL= https://your-webhook-url/
```

4. Start the application:

```bash
npm start
```

### Deployment

#### Docker Deployment

Create Dockerfile:

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

And docker-compose.yml:

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
Start:

```bash
docker-compose up -d
```

## App usage

1. Getting Started

Send the /start command to the bot in Telegram to register.

2. Connect GREEN-API instance

```text
/instance [idInstance] [apiTokenInstance]
```

- idInstance: Your GREEN-API instance ID  
- apiTokenInstance: Your GREEN-API instance API token  

Example:

```text
/instance 1101111111 abcdef123456789abcdef123456789
```

3. Checking Instance Status

```text
/status
```

или

```text
/getStateInstance
```

4. Replying to WhatsApp Messages

```text
/reply [WhatsApp number] [message text]
```

or

```text
/sendMessage [WhatsApp number] [message text]
```

5. Reset connected instance

```text
/resetInstance
```

6. Change language

```text
/language en
```

or

```text
/language ru
```

7. Manage notifications

```text
/notifications on
```

or

```text
/notifications off
```

8. Help

```text
/help
```

## Important Notes

### Obtaining GREEN-API Credentials

For the integration to work, you will need:

1. `idInstance` - ID of your instance in GREEN-API      
2. `apiTokenInstance` - Access token of your instance       

These credentials can be obtained in the GREEN-API console after creating an instance.     

### Supported Message Types

The integration supports the following WhatsApp message types:

- Text messages     
- Images (with captions)    
- Video (with captions) 
- Audio (with captions) 
- Documents (with captions) 
- Locations 
- Contacts  
- Polls     

### Data Storage

The integration uses SQLite database to store:

- Telegram user data   
- GREEN-API instance connections    
- User settings and preferences   
- Language preferences    
- Settings and states  

The database file `storage.db` is created automatically on first run.

## Troubleshooting

### Bot Not Responding to Commands

1. Check that TELEGRAM_BOT_TOKEN is set correctly   
2. Make sure the Telegram webhook is configured properly  
3. Check application logs for errors 

### Messages Not Delivered to WhatsApp

1. Check instance status with /status command   
2. Make sure the instance is authorized in GREEN-API   
3. Check webhook settings in GREEN-API personal account 

### File Sending Errors

1. Make sure your adapter URL is publicly accessible   
2. Check file size (Telegram and GREEN-API limitations)    
3. Make sure the file type is supported    

### Partner API Issues
1. Check the correctness of the partner token
2. Ensure the partner API is accessible
3. Check the logs for authentication errors

### Localization Issues
1. Ensure the localization files are present
2. Check the language installation using the /language command
