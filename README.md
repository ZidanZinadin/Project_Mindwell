# Mindwell AI

AI-powered mental wellbeing assistant with integrated chatbot support.

## Features

- AI-powered conversational support
- Real-time chat interface
- Safety features and crisis detection
- Privacy-focused design
- Cross-browser compatible

## Usage

This repository contains the static frontend for Mindwell AI. The site is intended to run as a static site (for example, via GitHub Pages) and does not require a backend for the local chatbot and demo functionality.

If you plan to run a separate backend (not included in this repository), keep API keys and secrets out of this public repo and deploy the server separately.

## Project Structure

```
├── index.html           - Home page
├── chatbot.html         - Chat interface
├── (server removed)     - Backend code removed; project is static-only
├── chatbot-new.js       - Chat widget
├── package.json         - Dependencies
└── .env.example         - Environment template
```

## API Endpoints

This repository doesn't contain a backend. The frontend uses a local, client-side chatbot by default. If you need a server-backed chatbot, maintain it in a separate private repo or folder and do not store secrets in this repo.

## License

MIT

# Updated Mon Dec 8 12:46:13 GMT 2025
