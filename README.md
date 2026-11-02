# PrepAI Placement Assistant 🚀

**Your AI‑powered interview coach that crafts custom mock interview questions in seconds.**

---

## ✨ Features
- **Dynamic mock interview questions** generated from your resume and a job description using the Gemini generative AI.
- **FAANG‑style interview rigor** – the system prompt acts as a strict technical interviewer.
- **Intelligent fallback** – automatically switches to a fast local model when Gemini is under heavy load.
- **Real‑time progress indicator** – see the generation stages update live on the UI.
- **Tailwind‑styled responsive UI** – clean, modern design that works on desktop and mobile.
- **Built‑in Antigravity SDK integration** – leverages Google Antigravity for a seamless development experience.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 16 (App Router, Server Actions)
- **Styling:** Tailwind CSS
- **AI Engine:** Google Gemini API (with automatic fallback to a local model)
- **Development Toolkit:** Google Antigravity SDK
- **Language:** TypeScript, React

---

## 📦 Local Installation
> **Prerequisites**
> - Node.js ≥ 18 (recommended LTS)
> - npm (comes with Node) or pnpm (if you prefer)
> - A Gemini API key (obtainable from the Gemini console)

1. **Clone the repository**
   ```bash
   git clone <repository‑url>
   cd <repo‑directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or, with pnpm (installed outside the sandbox on Windows)
   # pnpm install
   ```

3. **Create the environment file**
   At the project root, add a file named `.env.local` with the following content:
   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   # Antigravity SDK also reads this variable automatically
   ```
   Replace `YOUR_GEMINI_API_KEY_HERE` with the key you received from Gemini.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 🖥️ Usage
1. Paste your **resume** and the **job description** into the input fields on the homepage.
2. Click **Generate**. The UI shows a progress bar with stages (e.g., *Validating key → Calling Gemini → Fallback if needed*).
3. After a few seconds you’ll receive **three customized mock interview questions** ready for practice.

---

## 📄 License
This project is licensed under the **MIT License** – feel free to use, modify, and share.

---

## 🙋‍♀️ Contributing
Contributions are welcome! Fork the repo, create a feature branch, and submit a pull request. Keep the code style consistent with the existing TypeScript and Tailwind conventions.
