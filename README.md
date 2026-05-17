<div align="center">
  
  <img src="./frontend/public/globe.svg" alt="DevLens AI Logo" width="100" />

  # 🔍 DevLens AI

  **An AI-Powered GitHub Contributor Intelligence Platform**

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Gemini](https://img.shields.io/badge/Google_Gemini-AI-blue?style=flat&logo=google)](https://deepmind.google/technologies/gemini/)
  [![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat&logo=redis)](https://redis.io/)
  
  DevLens AI transforms raw GitHub data into meaningful insights, visual analytics, and professional developer summaries using Google's Gemini AI.

</div>

---

## ✨ Features

- 🧠 **AI-Generated Insights**: Get Gemini-powered developer summaries, role predictions, and automated skill assessments.
- 📊 **Contribution Analytics**: Deep-dive into commit history, language distribution, and coding patterns over time.
- 🎯 **Skill Radar**: Visual skill map showing language proficiency, frameworks, and tool usage.
- ⚔️ **Developer Compare**: Side-by-side comparison of two GitHub profiles with animated metrics and overlapping radar charts.
- 🏅 **Repo Quality Scorer**: Automated repository analysis evaluating `README.md` quality, CI/CD integrations, documentation, and testing frameworks.
- ⚡ **High Performance**: Built with a highly-optimized FastAPI backend and heavily cached via Redis to ensure lightning-fast analysis and prevent rate limiting.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **Language**: TypeScript

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **AI Integration**: Google Generative AI (Gemini 2.0 Flash)
- **Caching**: Redis & Hiredis
- **Language**: Python 3.11+
- **Data Gathering**: GitHub REST API & GraphQL

---

## 🚀 Getting Started

Follow these instructions to set up DevLens AI locally on your machine.

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- Redis Server (Running on default port `6379`)
- GitHub Personal Access Token
- Google Gemini API Key

### 1. Clone the repository
```bash
git clone https://github.com/Anik000007/devlens-ai.git
cd devlens-ai
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory with your API keys:
```env
GITHUB_TOKEN=ghp_your_github_personal_access_token
GEMINI_API_KEY=your_google_gemini_api_key
REDIS_URL=redis://localhost:6379/0
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```
*The backend API will be running at `http://localhost:8000`.*

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install the dependencies:
```bash
cd frontend
npm install
```

Start the Next.js development server:
```bash
npm run dev
```
*The frontend application will be running at `http://localhost:3000`.*

---

## 💡 Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. On the **Explore** page, use the live search bar to query GitHub for developers.
3. Click on a developer to view their **Profile Analytics** (Commit history, languages, AI summary).
4. Use the **Compare** page to evaluate two developers side-by-side.
5. Search for a specific repository (e.g. `torvalds/linux`) to view the **Repository Quality Score**.

---

## 🛡️ Architecture & Graceful Degradation

DevLens AI is designed with strict fallback mechanisms:
- **No Redis?** The app will bypass caching and fetch live data without crashing.
- **No Gemini API Key?** The app will fall back to dynamic template-based summaries so the UI continues to function perfectly.
- **GitHub Rate Limits:** Handled transparently. For high-volume usage, ensure `GITHUB_TOKEN` is set to increase the limit from 60 to 5,000 requests/hour.

---

<div align="center">
  Built with ❤️ by Anik
</div>
