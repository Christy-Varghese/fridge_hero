# 🦸 Fridge Hero

**Turn whatever's left in your fridge into a restaurant-quality recipe — powered by AI.**

You type `eggs, leftover rice, green chilli`. You pick **Chettinad**. You click one button. Seconds later you have a beautifully named dish, a 3-step recipe written like a chef's menu card, an AI-generated food photograph, and a YouTube channel to watch while you cook.

No sign-up. No backend. No nonsense.

---

## ✨ Features

- 🥕 **Dynamic ingredient list** — add or remove ingredients on the fly
- 🗺️ **50+ regional Indian cuisines** — from Malabar coastal to Kashmiri Wazwan to Naga smoky-fermented
- 🤖 **AI recipe generation** — Google Gemini 2.5 Flash writes a 3-step restaurant-style recipe
- 📸 **Smart image sourcing** — AI-generated food photography with automatic fallbacks
- 🔗 **Full image attribution** — every photo links back to its original source
- 📺 **YouTube suggestions** — relevant regional cooking channels served alongside each recipe
- 📱 **Fully responsive** — works great on mobile, tablet, and desktop

---

## 🚀 How it works

1. 🧅 **Add your ingredients** — type whatever you actually have, one per field
2. 🌶️ **Pick a regional style** — choose from 50+ Indian regional cuisines, or let the AI decide
3. 🪄 **Hit Cook Magic** — sit back while Gemini conjures a recipe and the app hunts down the perfect dish photo

---

## 🛠️ Setup

You need a free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/christy-varghese/fridge_hero.git
cd fridge_hero

# Copy the key config template and paste your key inside it
cp config.example.js config.js
# Open config.js and replace PASTE_YOUR_KEY_HERE with your actual key
```

Then serve the folder over HTTP (required — the browser's fetch API doesn't work over `file://`):

```bash
# Python — built-in, no install needed
python3 -m http.server 8080
```

Open [localhost:8080](http://localhost:8080) and start cooking. 🍳

> 💡 **VS Code?** The [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) works great too — right-click `index.html` → "Open with Live Server".

---

## 📸 Image sources

Fridge Hero tries each source in order and uses the first that works:

| # | Service | What it provides |
|---|---------|-----------------|
| 1 | [Pollinations AI](https://pollinations.ai) | 🎨 AI-generated food photography from the recipe description |
| 2 | [Openverse](https://openverse.org) | 🔓 Creative Commons licensed food photos |
| 3 | [TheMealDB](https://www.themealdb.com) | 🍽️ Curated recipe database images |
| 4 | [Lorem Flickr](https://loremflickr.com) | 📷 Stock food photography (last resort) |

Every image shown links back to its original source with full credit.

---

## ⚙️ Tech

Pure vanilla — no frameworks, no bundler, no build step.

| Layer | Tech |
|-------|------|
| 🏗️ Structure | HTML5 (semantic, ARIA-labelled) |
| 🎨 Styling | CSS3 with variables, responsive grid |
| ⚡ Logic | Vanilla JavaScript ES6+ |
| 🧠 AI | [Google Gemini 2.5 Flash](https://aistudio.google.com) |
| 📝 Markdown | [marked.js](https://marked.js.org) (CDN) |
| 🔤 Font | [Poppins](https://fonts.google.com/specimen/Poppins) (Google Fonts) |

---

## 📁 Project structure

```
fridge_hero/
├── 📄 index.html          # App shell — ingredient form, cuisine selector, recipe card
├── ⚡ app.js              # All application logic (~540 lines)
├── 🎨 styles.css          # Layout, colour scheme, responsive design
├── 🔑 config.example.js   # API key template — copy to config.js to get started
└── 🔐 config.js           # Your API key — gitignored, never committed
```

---

## 🗺️ Cuisines covered

Kerala · Tamil Nadu · Karnataka · Andhra Pradesh · Telangana · Maharashtra · Goa · Gujarat · Rajasthan · Punjab · Haryana · Uttar Pradesh · Bihar · Jharkhand · West Bengal · Odisha · Assam · Manipur · Nagaland · Meghalaya · Himachal Pradesh · Jammu & Kashmir · Ladakh · Madhya Pradesh · Chhattisgarh · and more.

---

## 📜 License

MIT — do whatever you want with it.
