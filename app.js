/** Paste your Gemini API key from https://aistudio.google.com/apikey (do not commit real keys). */
const GEMINI_API_KEY = "AIzaSyAZSCDJFbx2yzR_pjuLgtFAo5AK-K_3CiA";

const IMAGE_PROMPT_DELIMITER = "###IMAGE_PROMPTS_JSON###";

const cookButton = document.getElementById("cookButton");
const buttonText = document.getElementById("buttonText");
const statusEl = document.getElementById("status");
const resultError = document.getElementById("resultError");
const recipeCard = document.getElementById("recipeCard");
const recipeMarkdown = document.getElementById("recipeMarkdown");
const ingredientsList = document.getElementById("ingredientsList");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const cuisineSelect = document.getElementById("cuisineSelect");
const recipeVisuals = document.getElementById("recipeVisuals");
const dishImage = document.getElementById("dishImage");
const imageSourcesSection = document.getElementById("imageSourcesSection");
const imageSourcesList = document.getElementById("imageSourcesList");
const youtubeSection = document.getElementById("youtubeSection");
const youtubeChannelLink = document.getElementById("youtubeChannelLink");

function refreshIngredientRows() {
  const rows = ingredientsList.querySelectorAll(".ingredient-row");
  rows.forEach((row, i) => {
    if (i < 2) row.classList.remove("field-full");
    else row.classList.add("field-full");
    const label = row.querySelector("label");
    const input = row.querySelector(".js-ingredient");
    const n = i + 1;
    label.textContent = "Ingredient " + n;
    label.setAttribute("for", "ingredient-" + n);
    input.id = "ingredient-" + n;
  });
  const disableRemove = rows.length <= 1;
  rows.forEach((row) => {
    const btn = row.querySelector(".btn-remove-ingredient");
    if (btn) btn.disabled = disableRemove;
  });
}

function addIngredientRow() {
  const row = document.createElement("div");
  row.className = "field ingredient-row field-full";
  row.innerHTML =
    '<label for="ingredient-new">Ingredient</label>' +
    '<div class="ingredient-row__inner">' +
    '<input type="text" class="js-ingredient" placeholder="e.g. herbs" autocomplete="off" />' +
    '<button type="button" class="btn-remove-ingredient" aria-label="Remove ingredient">×</button>' +
    "</div>";
  ingredientsList.appendChild(row);
  refreshIngredientRows();
  row.querySelector(".js-ingredient").focus();
}

function removeIngredientRow(button) {
  const row = button.closest(".ingredient-row");
  if (!row || ingredientsList.querySelectorAll(".ingredient-row").length <= 1) return;
  row.remove();
  refreshIngredientRows();
}

function getIngredientsListText() {
  const values = Array.from(ingredientsList.querySelectorAll(".js-ingredient"))
    .map((el) => el.value.trim())
    .filter(Boolean);
  if (values.length === 0) return "";
  if (values.length === 1) return "I have " + values[0] + ". ";
  if (values.length === 2) return "I have " + values[0] + " and " + values[1] + ". ";
  const head = values.slice(0, -1).join(", ");
  return "I have " + head + ", and " + values[values.length - 1] + ". ";
}

function getCuisineInstruction() {
  const v = cuisineSelect.value.trim();
  if (!v) {
    return "If it fits the ingredients, you may draw inspiration from any regional Indian kitchen; otherwise choose a coherent global style.";
  }
  return (
    "The dish must clearly reflect **" +
    v +
    "** cooking: typical spices, techniques, and naming where appropriate. Mention the region subtly in the menu blockquote if natural."
  );
}

function splitRecipeAndImagePrompts(raw) {
  const idx = raw.indexOf(IMAGE_PROMPT_DELIMITER);
  if (idx === -1) {
    return { markdown: raw.trim(), prompts: null };
  }
  let jsonStr = raw.slice(idx + IMAGE_PROMPT_DELIMITER.length).trim();
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/m, "");
  let prompts = null;
  try {
    prompts = JSON.parse(jsonStr);
  } catch (e) {
    console.warn("Image prompts JSON parse failed", e);
  }
  return { markdown: raw.slice(0, idx).trim(), prompts };
}

function clampPrompt(s, max) {
  const t = (s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function buildPollinationsUrl(prompt, width, height) {
  const base = "https://image.pollinations.ai/prompt/";
  const q = encodeURIComponent(clampPrompt(prompt, 280));
  return base + q + "?width=" + width + "&height=" + height + "&nologo=true";
}

function resetImageSources() {
  imageSourcesList.innerHTML = "";
  imageSourcesSection.hidden = true;
}

function appendImageSource(slot, imageUrl, pageUrl, credit, provider) {
  const li = document.createElement("li");
  const slotEl = document.createElement("span");
  slotEl.className = "image-sources__slot";
  slotEl.textContent = slot;
  const linkImg = document.createElement("a");
  linkImg.href = imageUrl;
  linkImg.target = "_blank";
  linkImg.rel = "noopener noreferrer";
  linkImg.textContent = "Direct image URL (file)";
  li.appendChild(slotEl);
  li.appendChild(document.createTextNode(" "));
  li.appendChild(linkImg);
  if (pageUrl && pageUrl !== imageUrl) {
    li.appendChild(document.createTextNode(" · "));
    const linkPage = document.createElement("a");
    linkPage.href = pageUrl;
    linkPage.target = "_blank";
    linkPage.rel = "noopener noreferrer";
    linkPage.textContent = "Page where image was collected from";
    li.appendChild(linkPage);
  }
  const cred = document.createElement("span");
  cred.className = "image-sources__credit";
  cred.textContent = credit + " · " + provider;
  li.appendChild(cred);
  imageSourcesList.appendChild(li);
  imageSourcesSection.hidden = false;
}

function resetYoutubeSection() {
  youtubeSection.hidden = true;
  youtubeChannelLink.removeAttribute("href");
  youtubeChannelLink.textContent = "";
}

function isAllowedYoutubeUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    return (
      h === "youtube.com" ||
      h === "m.youtube.com" ||
      h === "youtu.be" ||
      h === "music.youtube.com"
    );
  } catch (_) {
    return false;
  }
}

function applyYoutubeFromPrompts(prompts) {
  resetYoutubeSection();
  const raw = prompts && typeof prompts.youtube === "string" ? prompts.youtube.trim() : "";
  if (!raw || raw === '""') return;
  let url = raw.replace(/^["']|["']$/g, "");
  if (!/^https?:\/\//i.test(url)) return;
  if (!isAllowedYoutubeUrl(url)) return;
  youtubeChannelLink.href = url;
  youtubeChannelLink.textContent = url.length > 72 ? url.slice(0, 69) + "…" : url;
  youtubeSection.hidden = false;
}

function loadImageInto(img, src) {
  return new Promise((resolve, reject) => {
    const timeoutMs = 28000;
    const t = setTimeout(() => {
      cleanup();
      reject(new Error("Image load timeout"));
    }, timeoutMs);
    function cleanup() {
      clearTimeout(t);
      img.onload = null;
      img.onerror = null;
    }
    img.onload = function () {
      cleanup();
      if (img.naturalWidth > 0) resolve();
      else reject(new Error("Empty image"));
    };
    img.onerror = function () {
      cleanup();
      reject(new Error("Image failed"));
    };
    img.src = src;
  });
}

async function fetchOpenverseImage(query) {
  const q = (query || "indian food").trim().slice(0, 120);
  const url =
    "https://api.openverse.org/v1/images/?" +
    new URLSearchParams({ q, page_size: "10" }).toString();
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const data = await r.json();
    const hit = data.results?.find((x) => x.url && /^https?:\/\//i.test(String(x.url)));
    if (!hit) return null;
    const credit =
      hit.attribution ||
      [hit.title, hit.creator, hit.license].filter(Boolean).join(" · ") ||
      "Openverse";
    return {
      imageUrl: hit.url,
      pageUrl: hit.foreign_landing_url || hit.detail_url || hit.url,
      attribution: credit,
    };
  } catch (e) {
    console.warn("Openverse fetch failed", e);
    return null;
  }
}

async function fetchTheMealDbImage(term) {
  const pool = [term, "curry", "biryani", "indian", "chicken", "vegetarian"]
    .map((s) => (s || "").trim())
    .filter(Boolean);
  const seen = new Set();
  const terms = pool.filter((t) => (seen.has(t) ? false : (seen.add(t), true)));
  for (const t of terms) {
    try {
      const r = await fetch(
        "https://www.themealdb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(t.slice(0, 48))
      );
      if (!r.ok) continue;
      const data = await r.json();
      const m = data.meals?.[0];
      if (m && m.strMealThumb) {
        const pageUrl =
          m.strSource && /^https?:/i.test(m.strSource)
            ? m.strSource
            : "https://www.themealdb.com/meal.php?i=" + encodeURIComponent(m.idMeal);
        return {
          imageUrl: m.strMealThumb,
          pageUrl,
          title: m.strMeal || t,
        };
      }
    } catch (e) {
      console.warn("TheMealDB fetch failed", e);
    }
  }
  return null;
}

function loremFlickrUrl(width, height, seedText) {
  const raw = (seedText || "indian food").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const first = raw.split(" ").filter(Boolean)[0] || "food";
  return "https://loremflickr.com/" + width + "/" + height + "/" + first + ",food,cooking";
}

function buildQueriesDish(dishTitle, cuisineLabel, dishPrompt) {
  const parts = [
    dishTitle,
    cuisineLabel,
    dishPrompt,
    "indian food plated",
    "home cooked curry",
  ].filter(Boolean);
  return [...new Set(parts.map((p) => String(p).trim()).filter(Boolean))];
}

async function assignImageWithFallbacks(img, slotLabel, pollinationsUrl, searchQueries) {
  const queries = [...new Set(searchQueries.map((q) => String(q).trim()).filter(Boolean))];
  try {
    await loadImageInto(img, pollinationsUrl);
    appendImageSource(slotLabel, pollinationsUrl, pollinationsUrl, "Pollinations AI illustration", "AI");
    return;
  } catch (_) {
    /* try web */
  }
  for (const q of queries) {
    const ov = await fetchOpenverseImage(q);
    if (ov) {
      try {
        await loadImageInto(img, ov.imageUrl);
        appendImageSource(slotLabel, ov.imageUrl, ov.pageUrl, ov.attribution, "Openverse");
        return;
      } catch (_) {
        /* next */
      }
    }
  }
  const meal = await fetchTheMealDbImage(queries[0] || "curry");
  if (meal) {
    try {
      await loadImageInto(img, meal.imageUrl);
      appendImageSource(slotLabel, meal.imageUrl, meal.pageUrl, meal.title + " — TheMealDB", "TheMealDB");
      return;
    } catch (_) {
      /* next */
    }
  }
  const w = img.width || 512;
  const h = img.height || 384;
  const lf = loremFlickrUrl(w, h, queries[0] || "indian");
  try {
    await loadImageInto(img, lf);
    appendImageSource(
      slotLabel,
      lf,
      "https://loremflickr.com/",
      "Random stock photo — verify license before reuse",
      "Lorem Flickr"
    );
  } catch (_) {
    img.removeAttribute("src");
    appendImageSource(
      slotLabel,
      "https://loremflickr.com/",
      "https://loremflickr.com/",
      "Could not load an image for this slot",
      "unavailable"
    );
  }
}

function extractTitleFromMarkdown(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim().replace(/\s*—\s*.*$/, "").trim() : "";
}

function fallbackImagePrompts(cuisineLabel, dishTitle) {
  const region = cuisineLabel || "Indian regional";
  const dish = dishTitle || "featured dish";
  return {
    dish:
      "Professional food photography, " +
      dish +
      ", " +
      region +
      " cuisine, shallow depth of field, warm natural light, ceramic plate",
  };
}

async function setupRecipeImages(prompts, cuisineLabel, dishTitle) {
  resetImageSources();

  const p =
    prompts && typeof prompts === "object"
      ? prompts
      : fallbackImagePrompts(cuisineLabel, dishTitle);

  const dishPrompt =
    clampPrompt(p.dish, 280) || fallbackImagePrompts(cuisineLabel, dishTitle).dish;

  dishImage.alt = dishTitle ? "Main dish: " + dishTitle : "Suggested look of the main dish";
  dishImage.width = 960;
  dishImage.height = 540;

  recipeVisuals.hidden = false;

  const dishPoll = buildPollinationsUrl(dishPrompt + ", no text overlay", 960, 540);
  await assignImageWithFallbacks(
    dishImage,
    "Main dish image",
    dishPoll,
    buildQueriesDish(dishTitle, cuisineLabel, dishPrompt)
  );
}

function clearRecipeVisuals() {
  recipeVisuals.hidden = true;
  dishImage.removeAttribute("src");
  dishImage.alt = "";
  resetImageSources();
  resetYoutubeSection();
}

addIngredientBtn.addEventListener("click", addIngredientRow);

ingredientsList.addEventListener("click", function (e) {
  const t = e.target;
  if (t.closest && t.closest(".btn-remove-ingredient")) {
    removeIngredientRow(t.closest(".btn-remove-ingredient"));
  }
});

refreshIngredientRows();

function hideResults() {
  recipeCard.classList.remove("is-visible");
  resultError.classList.remove("is-visible");
  resultError.textContent = "";
  recipeMarkdown.innerHTML = "";
  clearRecipeVisuals();
}

function showError(message) {
  recipeCard.classList.remove("is-visible");
  recipeMarkdown.innerHTML = "";
  clearRecipeVisuals();
  resultError.textContent = message;
  resultError.classList.add("is-visible");
}

function showRecipeHtml(html) {
  resultError.classList.remove("is-visible");
  resultError.textContent = "";
  recipeMarkdown.innerHTML = html;
  recipeCard.classList.add("is-visible");
}

async function generateRecipe() {
  const intro = getIngredientsListText();
  if (!intro) {
    hideResults();
    statusEl.textContent = "Please enter at least one ingredient.";
    return;
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY") {
    hideResults();
    statusEl.textContent = "Set your Gemini API key at the top of app.js.";
    return;
  }

  const cuisineLine = getCuisineInstruction();
  const cuisineLabel = cuisineSelect.value.trim() || "Regional Indian / global";

  const originalText = buttonText.textContent;
  hideResults();
  buttonText.textContent = "Loading...";
  cookButton.disabled = true;
  statusEl.textContent = "Summoning your Fridge Hero…";

  const spinner = document.createElement("span");
  spinner.className = "spinner";
  spinner.setAttribute("aria-hidden", "true");
  cookButton.appendChild(spinner);

  try {
    const prompt =
      intro +
      cuisineLine +
      " Create ONE menu-worthy offering that fits those ingredients. " +
      "The **name must sound like a real restaurant menu title** — refined, evocative, title case; you may add a short poetic subtitle after an em dash on the same line (e.g. `# Ember & Silk — Charred Shallot Tarte with Black Garlic`). " +
      "You **must** state clearly what kind of item it is: e.g. cold drink, hot drink, soup, salad, appetizer, main course (solid plated food), side, dessert, etc. Say explicitly whether it is **liquid** or **solid food** where that applies. " +
      "Use plausible **restaurant course labels** (e.g. Appetizer, First course, Main, Dessert, Beverage / non-alcoholic beverage, etc.). " +
      "Give a simple **3-step** recipe. " +
      "Output **Markdown only** for the recipe part, in this order: " +
      "1) `# [Restaurant-style name]` (single line). " +
      "2) A blockquote line with the menu classification, e.g. " +
      "`> **Course:** Main · **Form:** Solid · *Warm plated entrée*` or " +
      "`> **Course:** Beverage · **Form:** Liquid · *Chilled, served in a glass*` " +
      "— always include **Course** (menu section) and **Form** (liquid vs solid; add temperature or serve style if useful). " +
      "3) `## Ingredients` with a bullet list. 4) `## Steps` with numbered steps 1. 2. 3. " +
      "Use **bold** sparingly. " +
      "After the recipe Markdown is complete, output a single new line exactly: " +
      IMAGE_PROMPT_DELIMITER +
      " then immediately a **raw JSON object** (no markdown fences) with this shape only: " +
      '{"dish":"short English prompt for ONE hero food photo of the finished main dish only","youtube":""}' +
      ". The dish string: visual-only (food, plating, lighting, regional cues), under 220 characters, **no text or watermark in image**. " +
      "For **youtube**: if you know a **real** YouTube channel URL that fits this cuisine or dish style (channel, @handle, or /c/ page), put the full https URL; otherwise use an empty string. Never invent fake URLs.";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        encodeURIComponent(GEMINI_API_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      let detail = "";
      try {
        const errBody = await response.json();
        if (errBody.error && errBody.error.message) detail = " " + errBody.error.message;
      } catch (_) {}
      throw new Error("We couldn’t reach the recipe service." + detail);
    }

    const data = await response.json();

    let text = "";
    try {
      text = data.candidates[0].content.parts[0].text || "";
    } catch (e) {
      throw new Error("Unexpected response from the server. Please try again.");
    }

    if (!text.trim()) {
      throw new Error("No recipe came back. Please try again.");
    }

    const { markdown, prompts } = splitRecipeAndImagePrompts(text);
    if (!markdown) {
      throw new Error("No recipe content could be parsed. Please try again.");
    }

    const html =
      typeof marked !== "undefined" && marked.parse ? marked.parse(markdown.trim()) : markdown;
    showRecipeHtml(html);

    const dishTitle = extractTitleFromMarkdown(markdown);
    applyYoutubeFromPrompts(prompts);
    statusEl.textContent = "Bon appétit!";
    void setupRecipeImages(prompts, cuisineLabel, dishTitle).catch((e) =>
      console.warn("Image setup", e)
    );
  } catch (error) {
    console.error(error);
    const msg =
      error && error.message
        ? error.message
        : "Something went wrong while generating your recipe. Please try again in a moment.";
    showError(msg);
    statusEl.textContent = "";
  } finally {
    cookButton.disabled = false;
    buttonText.textContent = originalText;
    if (spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }
  }
}

cookButton.addEventListener("click", generateRecipe);
