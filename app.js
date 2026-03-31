/** Paste your Gemini API key from https://aistudio.google.com/apikey (do not commit real keys). */
const GEMINI_API_KEY = "YOUR_API_KEY";

const cookButton = document.getElementById("cookButton");
const buttonText = document.getElementById("buttonText");
const statusEl = document.getElementById("status");
const resultError = document.getElementById("resultError");
const recipeCard = document.getElementById("recipeCard");
const recipeMarkdown = document.getElementById("recipeMarkdown");
const ingredientsList = document.getElementById("ingredientsList");
const addIngredientBtn = document.getElementById("addIngredientBtn");

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
}

function showError(message) {
  recipeCard.classList.remove("is-visible");
  recipeMarkdown.innerHTML = "";
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
      "Create ONE menu-worthy offering that fits those ingredients. " +
      "The **name must sound like a real restaurant menu title** — refined, evocative, title case; you may add a short poetic subtitle after an em dash on the same line (e.g. `# Ember & Silk — Charred Shallot Tarte with Black Garlic`). " +
      "You **must** state clearly what kind of item it is: e.g. cold drink, hot drink, soup, salad, appetizer, main course (solid plated food), side, dessert, etc. Say explicitly whether it is **liquid** or **solid food** where that applies. " +
      "Use plausible **restaurant course labels** (e.g. Appetizer, First course, Main, Dessert, Beverage / non-alcoholic beverage, etc.). " +
      "Give a simple **3-step** recipe. " +
      "Output **Markdown only**, in this order: " +
      "1) `# [Restaurant-style name]` (single line). " +
      "2) A blockquote line with the menu classification, e.g. " +
      "`> **Course:** Main · **Form:** Solid · *Warm plated entrée*` or " +
      "`> **Course:** Beverage · **Form:** Liquid · *Chilled, served in a glass*` " +
      "— always include **Course** (menu section) and **Form** (liquid vs solid; add temperature or serve style if useful). " +
      "3) `## Ingredients` with a bullet list. 4) `## Steps` with numbered steps 1. 2. 3. " +
      "Use **bold** sparingly.";

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

    const html = typeof marked !== "undefined" && marked.parse ? marked.parse(text.trim()) : text;
    showRecipeHtml(html);
    statusEl.textContent = "Bon appétit!";
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
