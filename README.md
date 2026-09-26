# Veya — Universal AI Skill Engine

> **Turn what you want into a clear path forward.**

[![Live Web Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-6366F1?style=for-the-badge&logo=github)](https://shubham230523.github.io/Veya/)
[![Build & Deploy](https://img.shields.io/github/actions/workflow/status/shubham230523/Veya/deploy-gh-pages.yml?branch=master&style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/shubham230523/Veya/actions)

---

## 🌐 Live Demo

🚀 **Try the live web app:** [https://shubham230523.github.io/Veya/](https://shubham230523.github.io/Veya/)

Repository: [https://github.com/shubham230523/Veya](https://github.com/shubham230523/Veya)

---

## 💡 What is Veya?

**Veya** is a universal AI Skill Engine that translates natural language goals into structured, multi-step execution pipelines.

Instead of wrestling with manual prompt engineering or searching for scattered LLM instructions, users describe their objective in plain English. Veya researches the web prompt ecosystem, composes modular **Skills** into ordered **Workflows**, and formats system prompt payloads adapted for **Google Gemini**, **Anthropic Claude**, and **OpenAI GPT**.

```text
User Goal → AI Research → Modular Skills → Executable Pipeline → Provider Adapters → Outcome
```

---

## ✨ Key Features

- **🚀 Goal-Driven Workflow Composition**: Type any product or engineering goal (e.g. *"Build an AI-powered note-taking app with audio transcription"*) to compose an ordered execution pipeline.
- **🔍 AI Web Research Engine**: Streams streaming JSON via OpenRouter API to discover and generate production-ready Skills across PRD specs, mobile/web architecture, audio pipelines, testing, and deployment.
- **⚡ Provider Adapter Engine**: Translates multi-step workflows into native prompt payloads tailored for:
  - **Google Gemini** (Structured System Instructions & Context Blocks)
  - **Anthropic Claude** (Modular `<skill>` XML Tag Context Syntax)
  - **OpenAI GPT / Codex / Cursor** (Markdown Role & System Directives)
- **✨ 1-Click AI Skill Generator**: Describe what you want an AI Skill to do and Veya generates the full objective, instructions, step pipeline, and output structure.
- **🌐 Web AI Skill Finder & GitHub URL Importer**: Search global AI prompt topics across the web or import raw GitHub markdown prompt URLs directly into your database.
- **🛡️ Integrated Security Scanner**: Scans skill instructions and prompt templates for prompt injection, sensitive data leakage, and high-risk directives.
- **☁️ Supabase PostgreSQL Cloud Database**: Cloud persistence for Canonical Skills, Workflow Pipelines, Step Overrides, and Community Reviews.
- **📲 Universal Cross-Platform Support**: Built with React Native, Expo Router, and TypeScript for iOS, Android, and Web.

---

## 🛠️ Execution Pipeline Architecture

```text
                    +-----------------------------+
                    |    Natural Language Goal    |
                    +-----------------------------+
                                   |
                                   v
                    +-----------------------------+
                    | AI Intent & Web Research    |
                    +-----------------------------+
                                   |
                                   v
                    +-----------------------------+
                    | Canonical Skill Discovery   |
                    +-----------------------------+
                                   |
                                   v
                    +-----------------------------+
                    | Multi-Step Workflow Composer|
                    +-----------------------------+
                                   |
            +----------------------+----------------------+
            |                      |                      |
            v                      v                      v
     +--------------+       +--------------+       +--------------+
     | Google Gemini|       |Anthropic Claude|     |  OpenAI GPT  |
     | System Payload|      |  XML Pipeline|       | Markdown Role|
     +--------------+       +--------------+       +--------------+
```

---

## 📂 Project Structure

```text
Veya/
├── src/
│   ├── app/                    # Expo Router screens & navigators
│   │   ├── (tabs)/             # Home, Discover, Library, Profile tabs
│   │   ├── skill/              # Skill Detail & Creator screens
│   │   └── workflow/           # Workflow Editor & Output Generator screens
│   ├── components/             # Reusable M3 / Tailwind-style UI components
│   ├── core/
│   │   ├── ai/                 # OpenRouter client, Intent Parser, Adapters, Composer
│   │   ├── database/           # Supabase client & environment configuration
│   │   ├── security/           # Static Security Scanner
│   │   └── theme/              # Theme tokens, palette, dark/light mode
│   ├── features/
│   │   ├── skills/             # Skill Service & Prompt Formatter
│   │   └── workflows/          # Workflow Service
│   └── types/                  # TypeScript interfaces for Skills, Workflows, Providers
├── .github/
│   └── workflows/              # GitHub Actions CD pipeline for GitHub Pages
└── __tests__/                  # Unit and integration test suites
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Expo CLI](https://docs.expo.dev/)

### Installation

```bash
# Clone repository
git clone https://github.com/shubham230523/Veya.git
cd Veya

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_AI_PROVIDER=openrouter
EXPO_PUBLIC_AI_MODEL=google/gemini-2.0-flash-exp:free
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally

```bash
# Start dev server (Expo Go / Web)
npm start

# Run web app
npm run web

# Run unit & integration tests
npm test

# Run TypeScript type check
npx tsc --noEmit
```

---

## 📦 Deployment & GitHub Actions

This project includes an automated GitHub Actions deployment workflow (`.github/workflows/deploy-gh-pages.yml`).

### Triggering a GitHub Pages Deployment

To publish a new live release to GitHub Pages:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The action will automatically compile the Expo web build (`npx expo export -p web`) and deploy it to `gh-pages` branch.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

[MIT](LICENSE)
