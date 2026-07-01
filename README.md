 # HomeOS
 
 **Your entire rental life in one private, self-hostable vault.** Track every home you have lived in, every lease you have signed, every payment you have made, and every document you have stored, then ask plain-English questions about it all.
 
 ![License: MIT](https://img.shields.io/badge/License-MIT-2563EB.svg) ![React](https://img.shields.io/badge/React-19-149ECA.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg) ![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg) ![PRs welcome](https://img.shields.io/badge/PRs-welcome-10B981.svg)
 
 HomeOS is free and open source. Clone it, run it, and build your own rental record keeper. No login, no sign up, no tracking. Your data lives in your own browser by default.
 
 > Status: MVP / testing build. Great for exploring and self-hosting; not yet a hardened production app. See the roadmap below.
 
 ## Why HomeOS
 
 Renters lose receipts, forget old landlords, and have no record of years of payments. HomeOS turns that scattered history into a single searchable timeline that you own.
 
 ## Features
 
 - **Zero-login workspaces** - open the app and start immediately, or create a fresh workspace anytime.
 - **Ask Your Data assistant** - type a question and get an instant answer computed from your own records (no API key needed). Try "what are my savings in 2008", "taxes I paid in 2015", "rent appreciation from 2001 to 2026", or "how was my experience in 2009".
 - **Download and share** - every answer can be exported as .txt or .csv, or shared straight to Telegram.
 - **Lifetime dashboard** - a portfolio snapshot, rent-growth chart, expense breakdown, timeline, and live local time plus weather for your city.
 - **Full record keeping** - properties, leases and clauses, payments ledger, utilities, maintenance tickets, and a document vault.
 - **Rich demo data** - a deterministic 25-year sample tenant (2001-2026) so the app feels real on first run.
 - **Optional AI** - plug in a Google Gemini key for live web-grounded chat and document OCR.
 
 
 ## Tech stack
 
 - **React 19** + **TypeScript** + **Vite 6**
 - **Tailwind CSS v4** for styling
 - **Express** dev/prod server (`server.ts`) with Vite middleware
 - **Open-Meteo** for free, key-less weather
 - **Google Gemini** (optional) for live chat and OCR
 - Data persists in the browser via `localStorage` (no database required)
 
 ## Quick start
 
 **Prerequisites:** Node.js 18 or newer.
 
 ```bash
 # 1. Clone
 git clone https://github.com/your-username/homeos.git
 cd homeos
 
 # 2. Install
 npm install
 
 # 3. (Optional) add a Gemini key for live AI - the core app works without it
 cp .env.example .env
 
 # 4. Run
 npm run dev
 ```
 
 Open http://localhost:3000. On first load the app seeds a 25-year demo workspace so you can explore right away.
 
 ### Scripts
 
 - `npm run dev` - start the dev server (Express + Vite middleware) on port 3000
 - `npm run build` - build the client and bundle the server into `dist/`
 - `npm start` - run the production build
 - `npm run lint` - type-check with `tsc --noEmit`
 
 
 ## Configuration
 
 All configuration is optional. The only setting is the Gemini key in `.env`:
 
 ```bash
 # Only needed for the optional live web AI chat and document OCR.
 GEMINI_API_KEY=your_key_here
 ```
 
 Get a free key at https://aistudio.google.com/apikey. Without it, the built-in data assistant still answers from your records.
 
 ## How your data works
 
 - On first run, HomeOS generates a deterministic demo: 18 homes across 7 cities, 1000+ payments, 800+ utility bills, 180+ maintenance tickets, and 1200+ document records spanning 2001-2026.
 - Everything is stored in your browser under `localStorage` keys prefixed with `rv_`. Clearing your browser data resets it.
 - Create your own workspace from the sidebar (Switch Workspace). You can start empty or import the sample data to explore.
 - Documents are stored as lightweight metadata and thumbnails only - no real files are generated, keeping the demo fast.
 
 ## The Ask Your Data assistant
 
 The chat assistant (brain button, bottom-right) runs a local query engine over your records first, so answers are instant and private. It understands aggregates (savings, taxes, rent, appreciation, utilities, deposits, experience) and record searches (documents, properties by city, pending payments, maintenance, leases, free text). If a Gemini key is set, anything it cannot answer locally falls back to live web-grounded AI.
 
 ## Project structure
 
 ```
 src/
  App.tsx # app shell, state, localStorage wiring
  main.tsx # entry; seeds the demo on first load
  seedData.ts # deterministic 25-year demo generator
  insights.ts # analytics + natural-language query engine
  types.ts # shared data models
  components/ # dashboard, hubs, assistant, onboarding, widgets
 server.ts # Express server + optional Gemini endpoints
 ```
 
 
 ## Deployment
 
 HomeOS is a standard Node app. Build it and run the bundled server anywhere that runs Node (Render, Railway, Fly.io, a VPS, or a container):
 
 ```bash
 npm run build
 npm start # serves dist/ via Express on port 3000
 ```
 
 Set `GEMINI_API_KEY` in the host environment if you want the optional AI features.
 
 ## Roadmap
 
 - Backend persistence and multi-device sync (data is browser-only today)
 - Real export center (Excel, PDF, tax packs) and a Telegram bot for delivery
 - Multiple saved workspaces and a workspace switcher
 - Document upload and preview
 - Accessibility pass and a test suite
 
 ## Contributing
 
 Contributions are welcome. Fork the repo, create a feature branch, run `npm run lint`, and open a pull request. Please keep changes focused and describe what you changed and how you tested it.
 
 ## License
 
 Released under the [MIT License](LICENSE). Build your own HomeOS, for free.
 
 ## Acknowledgements
 
 Weather by [Open-Meteo](https://open-meteo.com). Icons by [Lucide](https://lucide.dev). Optional AI by [Google Gemini](https://ai.google.dev).
 
