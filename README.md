# Mindwell Pulse

AI-powered mental wellbeing assistant with integrated chatbot support.

## Features

- AI-powered conversational support
- Real-time chat interface
- Safety features and crisis detection
- Privacy-focused design
- Cross-browser compatible

## Requirements

- Node.js 14+
- Deepseek API key

## Installation

```bash
npm install
```

## Setup

1. Copy `.env.example` to `.env`
2. Add your Deepseek API key to `.env`
3. Start the server:

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
├── index.html           - Home page
├── chatbot.html         - Chat interface
├── server.js            - Backend API
├── chatbot-new.js       - Chat widget
├── package.json         - Dependencies
└── .env.example         - Environment template
```

## API Endpoints

- `GET /health` - Server health check
- `POST /api/chat` - Send message and receive response

## License

MIT
# Updated Mon Nov 24 12:46:13 GMT 2025
