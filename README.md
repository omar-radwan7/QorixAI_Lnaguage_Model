# 💬 Qorix AI Assistant

**Qorix AI Assistant** is a lightweight, browser-based AI chat application that leverages the [OpenRouter API](https://openrouter.ai) (specifically the Deepseek model) to deliver intelligent and interactive conversations — all with zero backend.

---

## 🚀 Features

- AI chat interface with full message history  
- File upload for on-the-fly analysis  
- Secure API key management (stored in browser only)  
- Light/Dark mode toggle  
- Fully responsive and mobile-ready UI   
- Runs 100% client-side — no server or database required

---

## 🧑‍💻 Tech Stack

- **TypeScript / JavaScript** – Core logic  
- **React** – UI library  
- **Tailwind CSS** – Utility-first styling  
- **Shadcn UI** – Pre-styled component library  
- **HTML** – Application structure

---

## 🗝 How to Use

1. Sign up at [OpenRouter.ai](https://openrouter.ai)  
2. Generate a free API key (must start with `sk-or-v1-`)  
3. Open the app and paste your key into the settings panel  
4. Start chatting with the AI instantly!

> 🔒 Your API key and chat data are stored **locally in your browser**. Nothing is sent to any third-party servers except OpenRouter for inference.

---

## 📦 Data Storage

Qorix does **not use a traditional database**. Instead, it stores the following in `localStorage`:

- Chat history under `chat-sessions`  
- API key under `qorix_openrouter_api_key`  
- User preferences under `qorix_api_provider`

This makes the app fully client-side, private, and server-free — but data is tied to the current browser and will be lost if the user clears it.

---

## 📄 License

MIT License
