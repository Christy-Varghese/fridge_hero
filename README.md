# Fridge Hero

**Turn whatever's left in your fridge into a restaurant-quality recipe — powered by AI.**

You type "eggs, leftover rice, green chilli." You pick "Chettinad." You click one button. Seconds later you have a beautifully named dish, a 3-step recipe written like a chef's menu card, an AI-generated food photograph, and a YouTube channel to watch while you cook.

No sign-up. No backend. No nonsense.

---

## How it works

1. **Add your ingredients** — type whatever you actually have, one per field. Add as many as you like.
2. **Pick a regional style** — 50+ Indian regional cuisines to choose from, or let the AI decide.
3. **Hit Cook Magic** — Gemini 2.5 Flash writes you a recipe. The app sources a food photograph from multiple image services (Pollinations AI → Openverse → TheMealDB → Lorem Flickr), with full attribution for every image used.

---

## Setup

You need a free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/christy-varghese/fridge_hero.git
cd fridge_hero

# Copy the key config template and paste your key inside it
cp config.example.js config.js
# Open config.js in any editor and replace PASTE_YOUR_KEY_HERE with your key
```

Then serve the folder over HTTP (required — the fetch API doesn't work over `file://`):

```bash
# Python (built-in, no install needed)
python3 -m http.server 8080
```

Open [localhost:8080](http://localhost:8080) and start cooking.

> **VS Code?** The [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) works perfectly too — right-click `index.html` → "Open with Live Server".

---

## Image sources

Fridge Hero tries each source in order and uses the first that works:

| Priority | Service | What it provides |
|----------|---------|-----------------|
| 1 | [Pollinations AI](https://pollinations.ai) | AI-generated food photography from the recipe's description |
| 2 | [Openverse](https://openverse.org) | Creative Commons licensed food photos |
| 3 | [TheMealDB](https://www.themealdb.com) | Curated recipe database images |
| 4 | [Lorem Flickr](https://loremflickr.com) | Stock food photography (last resort) |

Every image shown links back to its original source with full credit.

---

## Tech

Pure vanilla — no frameworks, no bundler, no build step.

- **HTML / CSS / JavaScript** (ES6+)
- **[Google Gemini 2.5 Flash](https://aistudio.google.com)** — recipe generation
- **[marked.js](https://marked.js.org)** (CDN) — markdown → HTML for recipe cards
- **[Poppins](https://fonts.google.com/specimen/Poppins)** (Google Fonts) — typography

---

## Project structure

```
fridge_hero/
├── index.html          # App shell and ingredient/cuisine form
├── app.js              # All application logic (~540 lines)
├── styles.css          # Layout, color scheme, responsive design
├── config.example.js   # API key template — copy to config.js
└── config.js           # Your API key — gitignored, never committed
```

---

## License

MIT — do whatever you want with it.
