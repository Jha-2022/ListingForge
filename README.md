# ⚡ ListingForge

**Local-first product listing writer for home-based sellers on Etsy, Amazon India, and Meesho.**

A seller uploads 1 to 5 product photos and gets a marketplace-ready listing in their own brand tone. Everything runs locally on open-weight Vision-Language Models (via Ollama)—so **zero seller data or photos leave their machine**, and there is **no per-listing API cost**.

---

## 🌟 Highlights

- **Local-First Privacy**: Vision analysis and text generation run completely locally via Ollama.
- **Multi-Marketplace Rules Engine**:
  - **Etsy**: 140-char title limit, 13 high-value tags (≤20 chars each), artisan backstory & material focus.
  - **Amazon India**: 200-char title limit, 5 feature bullet points, 250-byte backend search terms, brand formatting.
  - **Meesho**: 100-char punchy title, catalog description, budget-friendly and festive tones.
- **Multilingual Support**: Generates in **English**, **Hindi**, or colloquial Indian e-commerce **Hinglish**.
- **Brand Voice Personalization**: Few-shot brand voice profiles to align listings with individual seller personality.
- **Interactive Listing Studio**:
  - Live character counts against strict marketplace limits.
  - Single-field targeted regeneration (e.g. *"make title punchier"*, *"emphasize Diwali festive gifting"*).
  - Inline editing with instant autosave.
  - One-click copy-to-clipboard for every field.
- **Batch Catalog Processing**: Upload a ZIP folder with subfolders of photos + optional metadata CSV for bulk listings with real-time SSE progress streaming.
- **Exporting**: One-click export to marketplace-ready CSV and JSON formats.

---

## 🚀 Quick Start (Docker Compose — Recommended)

The easiest way to run the entire stack (Frontend + Backend + Ollama) is with Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)

### 1. Launch Services
From the `listingforge` directory:

```bash
docker compose up -d --build
```

### 2. Pull the Vision-Language Model
Pull the default vision-language model into the Ollama container:

```bash
docker exec -it listingforge-ollama ollama pull qwen2.5vl:7b
```

> **Tip:** You can swap the model at any time with no code changes by setting `VLM_MODEL` (e.g. `llama3.2-vision:11b` or `gemma3:12b`):
> ```bash
> VLM_MODEL=llama3.2-vision:11b docker compose up -d
> docker exec -it listingforge-ollama ollama pull llama3.2-vision:11b
> ```

### 3. Open the App
- **Web UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000](http://localhost:4000)
- **Ollama API:** [http://localhost:11434](http://localhost:11434)

To stop the containers:
```bash
docker compose down
```

---

## 💻 Manual / Local Development Setup (Without Docker)

If you prefer running Node.js and Ollama directly on your machine:

### Prerequisites
1. **Node.js**: v20 or higher (`node -v`)
2. **Ollama**: Installed from [ollama.com](https://ollama.com) and running locally (`http://localhost:11434`)

### Step 1: Start Ollama and Pull the Model
Open a terminal and ensure Ollama is serving:
```bash
ollama serve
```

In another terminal, pull the model:
```bash
ollama pull qwen2.5vl:7b
```

### Step 2: Setup and Run the Backend
```bash
cd backend

# Install dependencies
npm install

# (Optional) Copy .env.example
copy .env.example .env

# Run database migrations and start server
npm run dev
```
Backend will start on **http://localhost:4000**.
Run smoke tests at any time with:
```bash
npm test
```

### Step 3: Setup and Run the Frontend
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be available at **http://localhost:5173**.

---

## 🔑 Batch Processing & License System

- **Free Tier**: Single listing creation and batch jobs up to **10 products** are completely free with zero restrictions.
- **Large Batches (>10 items)**: Requires an HMAC-signed license key.
  - You can generate and test developer license keys in the **Settings** tab of the web app or via the API:
    ```bash
    curl -X POST http://localhost:4000/api/license/generate \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"artisan@craftshop.in\"}"
    ```
  - Enter the resulting key in the **Settings** page or provide the header `x-license-key: <KEY>`.

---

## 📁 Project Structure

```
listingforge/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment configuration & marketplace rules
│   │   ├── controllers/     # Listings, Batch, VoiceProfiles, Export controllers
│   │   ├── db/              # SQLite database setup, migrations & schema.sql
│   │   ├── middlewares/     # Multer upload, Zod validator, License guard, Error handler
│   │   ├── prompts/         # Vision and writer prompts for Etsy, Amazon, Meesho
│   │   ├── repositories/    # Database query layers
│   │   ├── routes/          # Express API route declarations
│   │   ├── services/        # Ollama VLM, Sharp image resizing, Export, SSE services
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Main server entrypoint
│   └── tests/               # Jest & Supertest API smoke tests
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client & request interceptors
│   │   ├── components/      # Responsive navigation & UI components
│   │   ├── pages/           # Listings, Create, Detail Studio, Batch, Voices, Settings
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # Router configuration
│   │   └── main.tsx         # React root
│   ├── Dockerfile           # Multi-stage production Nginx container
│   └── vite.config.ts       # Vite proxy configuration
├── docker-compose.yml       # Production multi-container orchestration
├── Makefile                 # Make shortcuts (up, down, pull-model, test)
└── start.sh                 # Linux/macOS startup bash helper
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend**: Node.js 20+, Express, SQLite (`better-sqlite3`), Zod, Multer, Sharp, `adm-zip`, `csv-stringify`, Pino logger
- **Inference Engine**: Ollama running `qwen2.5vl:7b` (or swap to `llama3.2-vision:11b`, `gemma3:12b`)
- **Containers**: Docker & Docker Compose
