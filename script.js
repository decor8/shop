/* ===========================================================
   Ful ko Paila — shop config
   Edit the values in this block. Nothing else needs to change
   for day-to-day running of the shop.
=========================================================== */
const CONFIG = {
  // Publish your Google Sheet: File > Share > Publish to web >
  // choose the product sheet/tab > CSV > Publish, then paste the
  // link it gives you here.
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/1TKVFZXRoAT2CzLqTNZsIfo7W4pIc4y1hAWZWXWHxDLc/edit?gid=0#gid=0",

  // Optional: URL to settings sheet CSV. If left blank, it is auto-derived from the main sheet.
  SETTINGS_CSV_URL: "",

  // WhatsApp number in international format, digits only, no + or spaces.
  // Example: Nepal number 98XXXXXXXX with country code 977 -> "97798XXXXXXXX"
  WHATSAPP_NUMBER: "9779860588764",

  // Viber number in international format, digits only, no + or spaces. If empty, falls back to WhatsApp number.
  VIBER_NUMBER: "",

  // Phone number for direct calling (voice calls). If empty, falls back to WhatsApp number.
  PHONE_NUMBER: "",

  // Instagram handle, without the @
  INSTAGRAM_HANDLE: "FulKoPaila",

  // Facebook profile/page URL (optional)
  FACEBOOK_URL: "",

  // TikTok profile URL (optional)
  TIKTOK_URL: "",

  // Google Map URL (optional)
  GOOGLE_MAP_URL: "",

  // Shop physical address (optional)
  SHOP_ADDRESS: "",
  SHOP_ADDRESS_NP: "",

  CURRENCY_PREFIX: "Rs. ",

  SHOP_NAME: "Ful ko Paila",
  SHOP_NAME_NP: "फुलको पाइला",

  // Minimum quantity a customer can pick in the customizer
  MIN_CUSTOM_QTY: 1,
  MAX_CUSTOM_QTY: 20,
};

/* ===========================================================
   Small bilingual dictionary for UI chrome that's built by JS
   (product data itself is shown exactly as typed in the sheet —
   type Nepali directly into Name/Variant/Description if you want
   a product to read in Nepali).
=========================================================== */
const STRINGS = {
  all: { en: "All", np: "सबै" },
  qty: { en: "Qty", np: "परिमाण" },
  orderWhatsapp: { en: "Order on WhatsApp", np: "WhatsApp मा अर्डर गर्नुहोस्" },
  soldOut: { en: "Sold out", np: "बिक्री सकियो" },
  igCopied: {
    en: "Order details copied — paste them into the DM that just opened.",
    np: "अर्डर विवरण कपी भयो — भर्खरै खुलेको DM मा पेस्ट गर्नुहोस्।",
  },
  igFallback: {
    en: (h) => `Message your order to @${h} on Instagram.`,
    np: (h) => `आफ्नो अर्डर Instagram मा @${h} लाई म्यासेज गर्नुहोस्।`,
  },
  viberCopied: {
    en: "Order details copied — paste them into Viber chat.",
    np: "अर्डर विवरण कपी भयो — Viber च्याटमा पेस्ट गर्नुहोस्।",
  },
  viberFallback: {
    en: (num) => `Message your order to ${num} on Viber.`,
    np: (num) => `आफ्नो अर्डर Viber मा ${num} लाई म्यासेज गर्नुहोस्।`,
  },
  each: { en: "each", np: "प्रत्येक" },
  noExtra: { en: "No extra", np: "थप केही छैन" },
  linkCopied: { en: "Link copied to clipboard.", np: "लिंक कपी भयो।" },
  orderMsgCopied: { en: "Order details copied to clipboard.", np: "अर्डर विवरण कपी भयो।" },
};

function currentLang() {
  return document.body.classList.contains("lang-np") ? "np" : "en";
}
function t(key, ...args) {
  const entry = STRINGS[key];
  if (!entry) return "";
  const val = entry[currentLang()];
  return typeof val === "function" ? val(...args) : val;
}

/* ===========================================================
   CSV parsing — handles quoted fields and commas inside quotes,
   since Google Sheets exports can include either.
=========================================================== */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.trim() !== ""));
}

function rowsToProducts(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const idx = (name) => headers.indexOf(name);

  const iName = idx("name");
  const iCategory = idx("category");
  const iVariant = idx("variant");
  const iPrice = idx("price");
  const iImage = idx("image url");
  const iStock = idx("in stock");
  const iDesc = idx("description");
  const iRole = idx("customizer role");

  const products = rows.slice(1).map((r, i) => {
    const stockRaw = (iStock > -1 ? r[iStock] : "yes").trim().toLowerCase();
    const inStock = !["no", "false", "0", "sold out"].includes(stockRaw);
    const priceNum = parseFloat((iPrice > -1 ? r[iPrice] : "0").replace(/[^\d.]/g, "")) || 0;
    const roleRaw = (iRole > -1 ? r[iRole] : "").trim().toLowerCase();
    const imageRaw = (iImage > -1 ? r[iImage] : "").trim();
    // Supports one image, or several separated by commas and/or spaces.
    const images = imageRaw ? imageRaw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean) : [];

    return {
      id: `p${i}`,
      name: (iName > -1 ? r[iName] : "Untitled").trim(),
      category: (iCategory > -1 ? r[iCategory] : "Other").trim(),
      variant: (iVariant > -1 ? r[iVariant] : "").trim(),
      price: priceNum,
      images,
      inStock,
      description: (iDesc > -1 ? r[iDesc] : "").trim(),
      customizerRole: roleRaw, // "flower" | "addon" | "wrap" | ""
    };
  }).filter(p => p.name && p.name !== "Untitled");

  // Give each product a stable, human-readable slug (derived from its name)
  // so items can be linked to directly, e.g. yoursite.com/#item=rose-candle.
  // If two products share a name, later ones get -2, -3, etc.
  const slugCounts = {};
  products.forEach(p => {
    const base = slugify(p.name);
    slugCounts[base] = (slugCounts[base] || 0) + 1;
    p.slug = slugCounts[base] > 1 ? `${base}-${slugCounts[base]}` : base;
  });

  return products;
}

function slugify(str) {
  const s = (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

/* ===========================================================
   Category accent colors — cycled by name, so any new category
   you add later automatically gets a consistent color for its
   badge, card accent bar, and filter dot.
=========================================================== */
const ACCENTS = [
  { strong: "#E39A34", soft: "#F6E4C4", shadow: "rgba(227,154,52,0.35)" },  // marigold
  { strong: "#8C3A51", soft: "#F0DCE1", shadow: "rgba(140,58,81,0.30)" },   // thread
  { strong: "#3E5B44", soft: "#DCE6DC", shadow: "rgba(62,91,68,0.28)" },    // moss
  { strong: "#B5502E", soft: "#F1DED2", shadow: "rgba(181,80,46,0.30)" },   // clay
  { strong: "#4A4E7C", soft: "#DEDFEC", shadow: "rgba(74,78,124,0.28)" },   // plum
];

function accentFor(category) {
  const str = (category || "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

/* ===========================================================
   Rendering — main shelf
=========================================================== */
const shelfEl = document.getElementById("shelf");
const filtersEl = document.getElementById("filters");
const emptyStateEl = document.getElementById("empty-state");
const loadErrorEl = document.getElementById("load-error");
const toastEl = document.getElementById("toast");

let allProducts = [];
let activeCategory = "All";

function renderSkeleton(count = 6) {
  shelfEl.innerHTML = Array.from({ length: count }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-media"></div>
      <div class="skeleton-lines">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join("");
}

function placeholderIcon(category) {
  const cat = (category || "").toLowerCase();
  if (/candle/.test(cat)) {
    return `<svg class="placeholder-icon" viewBox="0 0 48 48"><path d="M18 20h12v20a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V20Z"/><path d="M22 20c0-6 2-8 2-12 0 4 2 6 2 12"/></svg>`;
  }
  if (/flower|wire|bloom/.test(cat)) {
    return `<svg class="placeholder-icon" viewBox="0 0 48 48"><circle cx="24" cy="16" r="7"/><circle cx="14" cy="26" r="6"/><circle cx="34" cy="26" r="6"/><path d="M24 23v19"/></svg>`;
  }
  return `<svg class="placeholder-icon" viewBox="0 0 48 48"><rect x="10" y="18" width="28" height="20" rx="2"/><path d="M10 25h28"/><path d="M24 18v20"/><path d="M18 18c0-4.5 2.7-8 6-8s6 3.5 6 8"/></svg>`;
}

function money(n) {
  return `${CONFIG.CURRENCY_PREFIX}${n.toLocaleString()}`;
}

function shareUrlFor(product) {
  const base = location.origin + location.pathname;
  return `${base}#item=${encodeURIComponent(product.slug)}`;
}

async function shareProduct(product) {
  const url = shareUrlFor(product);
  if (navigator.share) {
    try {
      await navigator.share({ title: product.name, text: `${product.name} — ${money(product.price)}`, url });
    } catch {
      /* user cancelled the share sheet — nothing to do */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast(t("linkCopied"));
  } catch {
    showToast(url);
  }
}

// If a sheet's Image URL is broken, wrong format, or blocked (common with
// Google Drive "view" links), swap in the placeholder icon instead of
// showing the browser's default broken-image icon.
function handleImgFallback(imgEl, category) {
  imgEl.addEventListener("error", () => {
    const tmp = document.createElement("div");
    tmp.innerHTML = placeholderIcon(category);
    imgEl.replaceWith(tmp.firstElementChild);
  }, { once: true });
}

function buildOrderMessage(product, qty) {
  const link = shareUrlFor(product);
  if (currentLang() === "np") {
    return [
      `नमस्ते ${CONFIG.SHOP_NAME_NP}! 🌸`,
      `मलाई यो अर्डर गर्नु छ:`,
      `• ${product.name}${product.variant ? " (" + product.variant + ")" : ""} × ${qty} — ${money(product.price * qty)}`,
      `वस्तुको लिंक: ${link}`,
      ``,
      `कृपया अर्को चरण बताइदिनुहोस्। धन्यवाद!`,
    ].join("\n");
  }
  return [
    `Hi ${CONFIG.SHOP_NAME}! 🌸`,
    `I'd like to order:`,
    `• ${product.name}${product.variant ? " (" + product.variant + ")" : ""} × ${qty} — ${money(product.price * qty)}`,
    `Item link: ${link}`,
    ``,
    `Could you let me know the next steps? Thank you!`,
  ].join("\n");
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 3200);
}

function renderFilters() {
  const categories = ["All", ...new Set(allProducts.map(p => p.category).filter(Boolean))];
  filtersEl.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === activeCategory ? " active" : "");
    btn.setAttribute("aria-pressed", cat === activeCategory ? "true" : "false");

    if (cat === "All") {
      btn.innerHTML = `<span class="en">All</span><span class="np">सबै</span>`;
    } else {
      const accent = accentFor(cat);
      btn.innerHTML = `<span class="dot" style="background:${accent.strong}"></span>${cat}`;
    }

    btn.addEventListener("click", () => {
      if (cat === activeCategory) return;
      activeCategory = cat;
      renderFilters();
      shelfEl.classList.add("is-switching");
      setTimeout(() => {
        renderShelf();
        shelfEl.classList.remove("is-switching");
      }, 120);
    });
    filtersEl.appendChild(btn);
  });
}

function renderShelf() {
  const visible = allProducts.filter(p => activeCategory === "All" || p.category === activeCategory);
  shelfEl.innerHTML = "";

  emptyStateEl.hidden = visible.length > 0;
  if (!visible.length) return;

  visible.forEach((product, i) => {
    const card = document.createElement("article");
    card.className = "card" + (product.inStock ? "" : " sold-out");
    card.style.animationDelay = `${Math.min(i, 8) * 45}ms`;
    card.dataset.slug = product.slug;

    const accent = accentFor(product.category);
    card.style.setProperty("--accent", accent.strong);
    card.style.setProperty("--accent-soft", accent.soft);
    card.style.setProperty("--accent-shadow", accent.shadow);

    card.innerHTML = `
      <div class="card-media">
        ${product.images.length
          ? `<img src="${product.images[0]}" alt="${product.name}" loading="lazy">`
          : placeholderIcon(product.category)}
        <div class="sold-out-badge"><span class="en">Sold out</span><span class="np">बिक्री सकियो</span></div>
        ${product.images.length > 1
          ? `
          <button type="button" class="nav-arrow prev" data-action="prev-img" aria-label="Previous image"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button type="button" class="nav-arrow next" data-action="next-img" aria-label="Next image"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <div class="img-dots">${product.images.map((_, di) => `<span class="img-dot${di === 0 ? " active" : ""}"></span>`).join("")}</div>
          `
          : ""}
      </div>
      <div class="price-tag">${money(product.price)}</div>
      <div class="card-body">
        ${product.category ? `<span class="category-badge">${product.category}</span>` : ""}
        <h3 class="card-name">${product.name}</h3>
        ${product.variant ? `<p class="card-variant">${product.variant}</p>` : ""}
        ${product.description ? `<p class="card-variant">${product.description}</p>` : ""}

        <div class="qty-row">
          <span><span class="en">Qty</span><span class="np">परिमाण</span></span>
          <div class="stepper">
            <button type="button" data-action="dec" aria-label="Decrease quantity">–</button>
            <output>1</output>
            <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <div class="order-actions">
          <button type="button" class="order-btn whatsapp" data-channel="whatsapp" ${product.inStock ? "" : "disabled"}>
            ${product.inStock
              ? `<span class="en">Order on WhatsApp</span><span class="np">WhatsApp मा अर्डर</span>`
              : `<span class="en">Sold out</span><span class="np">बिक्री सकियो</span>`}
          </button>
          ${product.inStock ? `
          <button type="button" class="order-btn copy-msg" data-channel="copy-msg">
            <span class="en">Copy Link</span><span class="np">लिंक कपी</span>
          </button>
          <button type="button" class="order-btn instagram" data-channel="instagram">
            DM
          </button>` : ""}
          <button type="button" class="order-btn share" data-channel="share" aria-label="Share this item">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M8 7l4-4 4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    `;

    const output = card.querySelector("output");
    card.querySelector('[data-action="dec"]').addEventListener("click", () => {
      output.textContent = Math.max(1, parseInt(output.textContent, 10) - 1);
    });
    card.querySelector('[data-action="inc"]').addEventListener("click", () => {
      output.textContent = Math.min(20, parseInt(output.textContent, 10) + 1);
    });

    const waBtn = card.querySelector('[data-channel="whatsapp"]');
    if (waBtn) {
      waBtn.addEventListener("click", () => {
        const qty = parseInt(output.textContent, 10);
        const msg = buildOrderMessage(product, qty);
        window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      });
    }

    const copyMsgBtn = card.querySelector('[data-channel="copy-msg"]');
    if (copyMsgBtn) {
      copyMsgBtn.addEventListener("click", async () => {
        const qty = parseInt(output.textContent, 10);
        const msg = buildOrderMessage(product, qty);
        try {
          await navigator.clipboard.writeText(msg);
          showToast(t("orderMsgCopied"));
        } catch {
          const url = shareUrlFor(product);
          await navigator.clipboard.writeText(url);
          showToast(t("linkCopied"));
        }
      });
    }

    const igBtn = card.querySelector('[data-channel="instagram"]');
    if (igBtn) {
      igBtn.addEventListener("click", async () => {
        const qty = parseInt(output.textContent, 10);
        const msg = buildOrderMessage(product, qty);
        try {
          await navigator.clipboard.writeText(msg);
          showToast(t("igCopied"));
        } catch {
          showToast(t("igFallback", CONFIG.INSTAGRAM_HANDLE));
        }
        window.open(`https://ig.me/m/${CONFIG.INSTAGRAM_HANDLE}`, "_blank", "noopener");
      });
    }

    card.querySelector('[data-channel="share"]').addEventListener("click", () => shareProduct(product));

    shelfEl.appendChild(card);

    if (product.images.length) {
      const mediaEl = card.querySelector(".card-media");
      const imgEl = mediaEl.querySelector("img");
      const dotEls = mediaEl.querySelectorAll(".img-dot");
      let idx = 0;
      let failCount = 0;

      const showImage = (newIdx) => {
        idx = newIdx;
        imgEl.src = product.images[idx];
        dotEls.forEach((d, di) => d.classList.toggle("active", di === idx));
      };

      imgEl.addEventListener("error", () => {
        failCount++;
        if (failCount >= product.images.length) {
          const tmp = document.createElement("div");
          tmp.innerHTML = placeholderIcon(product.category);
          mediaEl.querySelector(".img-dots")?.remove();
          mediaEl.querySelectorAll(".nav-arrow")?.forEach(a => a.remove());
          imgEl.replaceWith(tmp.firstElementChild);
          return;
        }
        showImage((idx + 1) % product.images.length);
      });

      if (product.images.length > 1) {
        mediaEl.style.cursor = "pointer";
        mediaEl.addEventListener("click", () => showImage((idx + 1) % product.images.length));
        dotEls.forEach((dot, di) => {
          dot.addEventListener("click", (e) => {
            e.stopPropagation();
            showImage(di);
          });
        });

        const prevBtn = mediaEl.querySelector('[data-action="prev-img"]');
        const nextBtn = mediaEl.querySelector('[data-action="next-img"]');

        if (prevBtn) {
          prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showImage((idx - 1 + product.images.length) % product.images.length);
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showImage((idx + 1) % product.images.length);
          });
        }
      }
    }
  });
}

// If the page was opened via a shared item link (#item=slug), scroll to
// that card and give it a brief highlight so it's obvious which one it is.
function highlightSharedItem() {
  if (!location.hash) return;
  const params = new URLSearchParams(location.hash.slice(1));
  const slug = params.get("item");
  if (!slug) return;
  const card = shelfEl.querySelector(`[data-slug="${CSS.escape(slug)}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("shared-highlight");
  setTimeout(() => card.classList.remove("shared-highlight"), 2600);
}

function wireFooterLinks() {
  const viberNumber = CONFIG.VIBER_NUMBER || CONFIG.WHATSAPP_NUMBER;
  const waLink = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}`;
  const viberLink = `viber://chat?number=${viberNumber}`;
  document.getElementById("footer-whatsapp").href = waLink;
  document.getElementById("empty-whatsapp-link").href = waLink;
  const footerViber = document.getElementById("footer-viber");
  if (footerViber) footerViber.href = viberLink;
  document.getElementById("footer-instagram").href = `https://instagram.com/${CONFIG.INSTAGRAM_HANDLE}`;
  const topbarWa = document.getElementById("topbar-whatsapp");
  if (topbarWa) topbarWa.href = waLink;
}

/* ===========================================================
   Quick Contact Bar & Settings tab integration
=========================================================== */
function getSettingsCSVUrl(url) {
  if (!url) return "";
  if (CONFIG.SETTINGS_CSV_URL && !CONFIG.SETTINGS_CSV_URL.includes("PASTE_YOUR")) {
    return getCSVUrl(CONFIG.SETTINGS_CSV_URL);
  }
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const docId = match[1];
    return `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&sheet=Settings`;
  }
  return "";
}

function updateTopbarBrand() {
  const brandNameEn = document.querySelector(".brand-name .en");
  const brandNameNp = document.querySelector(".brand-name .np");
  if (brandNameEn) brandNameEn.textContent = CONFIG.SHOP_NAME;
  if (brandNameNp) brandNameNp.textContent = CONFIG.SHOP_NAME_NP;
}

function updateUtilityBar() {
  let hasSocial = false;
  
  // Instagram
  const igEl = document.getElementById("top-instagram");
  if (igEl) {
    if (CONFIG.INSTAGRAM_HANDLE) {
      igEl.href = `https://instagram.com/${CONFIG.INSTAGRAM_HANDLE}`;
      igEl.style.display = "";
      hasSocial = true;
    } else {
      igEl.style.display = "none";
    }
  }

  // Facebook
  const fbEl = document.getElementById("top-facebook");
  if (fbEl) {
    if (CONFIG.FACEBOOK_URL) {
      fbEl.href = CONFIG.FACEBOOK_URL;
      fbEl.style.display = "";
      hasSocial = true;
    } else {
      fbEl.style.display = "none";
    }
  }

  // TikTok
  const ttEl = document.getElementById("top-tiktok");
  if (ttEl) {
    if (CONFIG.TIKTOK_URL) {
      ttEl.href = CONFIG.TIKTOK_URL;
      ttEl.style.display = "";
      hasSocial = true;
    } else {
      ttEl.style.display = "none";
    }
  }

  // Map
  const mapEl = document.getElementById("top-map");
  if (mapEl) {
    if (CONFIG.GOOGLE_MAP_URL) {
      mapEl.href = CONFIG.GOOGLE_MAP_URL;
      mapEl.style.display = "";
      mapEl.title = currentLang() === "np" ? (CONFIG.SHOP_ADDRESS_NP || CONFIG.SHOP_ADDRESS || "नक्सा") : (CONFIG.SHOP_ADDRESS || "Store Map");
    } else {
      mapEl.style.display = "none";
    }
  }

  // Show separator between socials and map if both exist
  const socialSep = document.getElementById("top-social-sep");
  if (socialSep) {
    socialSep.style.display = (hasSocial && CONFIG.GOOGLE_MAP_URL) ? "" : "none";
  }

  let hasContact = false;

  // Phone
  const phoneEl = document.getElementById("top-phone");
  if (phoneEl) {
    const phone = CONFIG.PHONE_NUMBER || CONFIG.WHATSAPP_NUMBER;
    if (phone) {
      phoneEl.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
      phoneEl.style.display = "";
      phoneEl.title = phone;
      hasContact = true;
    } else {
      phoneEl.style.display = "none";
    }
  }

  // WhatsApp
  const waEl = document.getElementById("top-whatsapp-link");
  if (waEl) {
    if (CONFIG.WHATSAPP_NUMBER) {
      waEl.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}`;
      waEl.style.display = "";
      hasContact = true;
    } else {
      waEl.style.display = "none";
    }
  }

  // Viber
  const viberEl = document.getElementById("top-viber-link");
  if (viberEl) {
    const viber = CONFIG.VIBER_NUMBER || CONFIG.WHATSAPP_NUMBER;
    if (viber) {
      viberEl.href = `viber://chat?number=${viber.replace(/[^\d+]/g, "")}`;
      viberEl.style.display = "";
      hasContact = true;
    } else {
      viberEl.style.display = "none";
    }
  }

  // Save Contact button
  const saveBtn = document.getElementById("top-save-contact");
  if (saveBtn) {
    const phone = CONFIG.PHONE_NUMBER || CONFIG.WHATSAPP_NUMBER;
    if (phone) {
      saveBtn.style.display = "";
      
      // Wire event listener once
      if (!saveBtn.dataset.wired) {
        saveBtn.addEventListener("click", saveContact);
        saveBtn.dataset.wired = "true";
      }
    } else {
      saveBtn.style.display = "none";
    }
  }

  // Show separator between contact info and Save Contact button if both exist
  const contactSep = document.getElementById("top-contact-sep");
  if (contactSep) {
    contactSep.style.display = (hasContact && (CONFIG.PHONE_NUMBER || CONFIG.WHATSAPP_NUMBER)) ? "" : "none";
  }
}

function saveContact() {
  const shopName = CONFIG.SHOP_NAME || "Ful ko Paila";
  const phone = CONFIG.PHONE_NUMBER || CONFIG.WHATSAPP_NUMBER || "";
  const whatsapp = CONFIG.WHATSAPP_NUMBER || "";
  const viber = CONFIG.VIBER_NUMBER || CONFIG.WHATSAPP_NUMBER || "";
  const address = CONFIG.SHOP_ADDRESS || "";
  const website = window.location.origin + window.location.pathname;

  let vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${shopName}`,
    `ORG:${shopName}`,
  ];

  if (phone) {
    const cleanedPhone = phone.startsWith("+") || phone.length < 10 ? phone : "+" + phone;
    vcard.push(`TEL;TYPE=CELL,VOICE:${cleanedPhone}`);
  }
  
  if (whatsapp) {
    const cleanedWa = whatsapp.startsWith("+") || whatsapp.length < 10 ? whatsapp : "+" + whatsapp;
    vcard.push(`TEL;TYPE=WORK,MSG;wa:${cleanedWa}`);
  }

  vcard.push(`URL:${website}`);
  
  if (address) {
    vcard.push(`ADR;TYPE=WORK:;;${address};;;;`);
  }

  vcard.push(`NOTE:Handmade wire flowers & candles. Order on WhatsApp or Viber.`);
  vcard.push("END:VCARD");

  const vcardString = vcard.join("\r\n");
  const blob = new Blob([vcardString], { type: "text/vcard;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${shopName.replace(/[^a-zA-Z0-9]/g, "_")}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(currentLang() === "np" ? "सम्पर्क कार्ड डाउनलोड भयो।" : "Contact card downloaded.");
}

async function loadSettings() {
  const url = getSettingsCSVUrl(CONFIG.SHEET_CSV_URL);
  if (!url) return;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    const text = await res.text();
    const rows = parseCSV(text);
    if (rows.length < 2) return;

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const iKey = headers.indexOf("key");
    const iVal = headers.indexOf("value");

    if (iKey === -1 || iVal === -1) {
      console.log("Settings sheet missing 'Key' or 'Value' columns.");
      return;
    }

    rows.slice(1).forEach(row => {
      const key = (row[iKey] || "").trim().toLowerCase();
      const val = (row[iVal] || "").trim();
      if (!key || !val) return;

      if (key === "whatsapp_number" || key === "whatsapp") {
        CONFIG.WHATSAPP_NUMBER = val.replace(/[^\d+]/g, "");
      } else if (key === "viber_number" || key === "viber") {
        CONFIG.VIBER_NUMBER = val.replace(/[^\d+]/g, "");
      } else if (key === "phone_number" || key === "phone" || key === "dial") {
        CONFIG.PHONE_NUMBER = val.replace(/[^\d+]/g, "");
      } else if (key === "instagram_handle" || key === "instagram") {
        CONFIG.INSTAGRAM_HANDLE = val.replace(/https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
      } else if (key === "facebook_url" || key === "facebook") {
        CONFIG.FACEBOOK_URL = val;
      } else if (key === "tiktok_url" || key === "tiktok") {
        CONFIG.TIKTOK_URL = val;
      } else if (key === "google_map_url" || key === "google_map" || key === "map") {
        CONFIG.GOOGLE_MAP_URL = val;
      } else if (key === "shop_address" || key === "address") {
        CONFIG.SHOP_ADDRESS = val;
      } else if (key === "shop_address_np" || key === "address_np") {
        CONFIG.SHOP_ADDRESS_NP = val;
      } else if (key === "shop_name") {
        CONFIG.SHOP_NAME = val;
      } else if (key === "shop_name_np") {
        CONFIG.SHOP_NAME_NP = val;
      }
    });

    // Re-wire and update the interface
    wireFooterLinks();
    updateTopbarBrand();
    updateUtilityBar();
    updateCustomizerSummary();
  } catch (err) {
    console.error("Failed to load settings:", err);
  }
}

/* ===========================================================
   Language toggle
=========================================================== */
function wireLangToggle() {
  const btn = document.getElementById("langToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const goingToNepali = document.body.classList.contains("lang-en");
    document.body.classList.toggle("lang-en", !goingToNepali);
    document.body.classList.toggle("lang-np", goingToNepali);
    btn.textContent = goingToNepali ? "EN" : "ने";
    // Re-render dynamic bits so any JS-generated text picks up the new language
    renderFilters();
    renderShelf();
    updateCustomizerSummary();
  });
}

/* ===========================================================
   Build-your-own customizer — entirely data-driven from the
   same sheet. Tag rows in the "Customizer Role" column:
     Flower -> base item, priced per piece
     Addon  -> optional extra (e.g. a candle)
     Wrap   -> required wrapping/packaging choice
   If no rows are tagged "Flower", the whole section hides.
=========================================================== */
const customizerSection = document.getElementById("customizer");
const flowerGridEl = document.getElementById("flowerGrid");
const addonStepEl = document.getElementById("addonStep");
const addonChoicesEl = document.getElementById("addonChoices");
const wrapStepEl = document.getElementById("wrapStep");
const wrapChoicesEl = document.getElementById("wrapChoices");
const stemCountEl = document.getElementById("stemCount");

const customizerState = {
  flowers: [],
  addons: [],
  wraps: [],
  flowerIdx: 0,
  qty: CONFIG.MIN_CUSTOM_QTY,
  addonIdx: -1, // -1 = none
  wrapIdx: 0,
};

function renumberSteps() {
  const steps = [
    document.querySelector('[data-step="item"] .step-num'),
    document.querySelector('[data-step="qty"] .step-num'),
    !addonStepEl.hidden ? addonStepEl.querySelector(".step-num") : null,
    !wrapStepEl.hidden ? wrapStepEl.querySelector(".step-num") : null,
  ].filter(Boolean);
  steps.forEach((el, i) => { el.textContent = i + 1; });
}

function renderFlowerGrid() {
  flowerGridEl.innerHTML = customizerState.flowers.map((p, i) => `
    <button type="button" class="flower-option ${i === customizerState.flowerIdx ? "selected" : ""}" data-idx="${i}">
      <span class="thumb">
        ${p.images.length ? `<img src="${p.images[0]}" alt="${p.name}">` : placeholderIcon(p.category)}
      </span>
      <span class="flabel">${p.name}<span class="fprice">${money(p.price)} <span class="en">each</span><span class="np">प्रत्येक</span></span></span>
    </button>
  `).join("");

  flowerGridEl.querySelectorAll(".flower-option").forEach(btn => {
    btn.addEventListener("click", () => {
      customizerState.flowerIdx = parseInt(btn.dataset.idx, 10);
      flowerGridEl.querySelectorAll(".flower-option").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateCustomizerSummary();
    });
    const idx = parseInt(btn.dataset.idx, 10);
    const img = btn.querySelector(".thumb img");
    if (img) handleImgFallback(img, customizerState.flowers[idx].category);
  });
}

function renderAddonChoices() {
  const noneBtn = `<button type="button" class="pill-choice ${customizerState.addonIdx === -1 ? "selected" : ""}" data-idx="-1"><span class="en">No extra</span><span class="np">थप केही छैन</span></button>`;
  const addonBtns = customizerState.addons.map((p, i) => `
    <button type="button" class="pill-choice ${i === customizerState.addonIdx ? "selected" : ""}" data-idx="${i}">
      ${p.name} +${money(p.price)}
    </button>
  `).join("");
  addonChoicesEl.innerHTML = noneBtn + addonBtns;

  addonChoicesEl.querySelectorAll(".pill-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      customizerState.addonIdx = parseInt(btn.dataset.idx, 10);
      addonChoicesEl.querySelectorAll(".pill-choice").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateCustomizerSummary();
    });
  });
}

function renderWrapChoices() {
  wrapChoicesEl.innerHTML = customizerState.wraps.map((p, i) => `
    <button type="button" class="pill-choice ${i === customizerState.wrapIdx ? "selected" : ""}" data-idx="${i}">
      ${p.name} +${money(p.price)}
    </button>
  `).join("");

  wrapChoicesEl.querySelectorAll(".pill-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      customizerState.wrapIdx = parseInt(btn.dataset.idx, 10);
      wrapChoicesEl.querySelectorAll(".pill-choice").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateCustomizerSummary();
    });
  });
}

function updateCustomizerSummary() {
  if (!customizerState.flowers.length) return;
  const flower = customizerState.flowers[customizerState.flowerIdx];
  const addon = customizerState.addonIdx > -1 ? customizerState.addons[customizerState.addonIdx] : null;
  const wrap = customizerState.wraps.length ? customizerState.wraps[customizerState.wrapIdx] : null;

  const itemTotal = flower.price * customizerState.qty;
  const addonPrice = addon ? addon.price : 0;
  const wrapPrice = wrap ? wrap.price : 0;
  const total = itemTotal + addonPrice + wrapPrice;

  stemCountEl.textContent = customizerState.qty;

  document.getElementById("sumItemLabel").textContent = `${customizerState.qty} × ${flower.name}`;
  document.getElementById("sumItemPrice").textContent = money(itemTotal);
  document.getElementById("sumAddonPrice").textContent = addon ? money(addonPrice) : "—";
  document.getElementById("sumWrapPrice").textContent = wrap ? money(wrapPrice) : "—";
  document.getElementById("sumTotal").textContent = money(total);

  const lang = currentLang();
  const orderBtn = document.getElementById("configOrderBtn");
  const link = shareUrlFor(flower);
  const lines = lang === "np"
    ? [
        `नमस्ते ${CONFIG.SHOP_NAME_NP}! 🌸`,
        `मलाई यसरी अर्डर गर्नु छ:`,
        `- ${customizerState.qty} x ${flower.name}`,
        addon ? `- थप वस्तु: ${addon.name}` : null,
        wrap ? `- र्‍यापिङ: ${wrap.name}` : null,
        `अनुमानित जम्मा: ${money(total)}`,
        `वस्तुको लिंक: ${link}`,
        ``,
        `कृपया उपलब्धता र डेलिभरी बारे जानकारी दिनुहोस्।`,
      ]
    : [
        `Hi ${CONFIG.SHOP_NAME}! 🌸`,
        `I'd like to order:`,
        `- ${customizerState.qty} x ${flower.name}`,
        addon ? `- Add-on: ${addon.name}` : null,
        wrap ? `- Wrapping: ${wrap.name}` : null,
        `Estimated total: ${money(total)}`,
        `Item link: ${link}`,
        ``,
        `Could you confirm availability and delivery? Thank you!`,
      ];
  const msg = lines.filter(Boolean).join("\n");
  orderBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  const viberBtn = document.getElementById("configViberBtn");
  if (viberBtn) {
    viberBtn.dataset.msg = msg;
  }
}

function buildCustomizer(products) {
  customizerState.flowers = products.filter(p => p.customizerRole === "flower" && p.inStock);
  customizerState.addons = products.filter(p => p.customizerRole === "addon" && p.inStock);
  customizerState.wraps = products.filter(p => p.customizerRole === "wrap" && p.inStock);

  if (!customizerState.flowers.length) {
    customizerSection.hidden = true;
    return;
  }
  customizerSection.hidden = false;

  addonStepEl.hidden = customizerState.addons.length === 0;
  wrapStepEl.hidden = customizerState.wraps.length === 0;

  renderFlowerGrid();
  renderAddonChoices();
  renderWrapChoices();
  renumberSteps();
  updateCustomizerSummary();

  document.getElementById("stemDec").addEventListener("click", () => {
    customizerState.qty = Math.max(CONFIG.MIN_CUSTOM_QTY, customizerState.qty - 1);
    updateCustomizerSummary();
  });
  document.getElementById("stemInc").addEventListener("click", () => {
    customizerState.qty = Math.min(CONFIG.MAX_CUSTOM_QTY, customizerState.qty + 1);
    updateCustomizerSummary();
  });

  const configViberBtn = document.getElementById("configViberBtn");
  if (configViberBtn) {
    configViberBtn.addEventListener("click", async () => {
      const msg = configViberBtn.dataset.msg || "";
      const viberNumber = CONFIG.VIBER_NUMBER || CONFIG.WHATSAPP_NUMBER;
      try {
        await navigator.clipboard.writeText(msg);
        showToast(t("viberCopied"));
      } catch {
        showToast(t("viberFallback", viberNumber));
      }
      window.open(`viber://chat?number=${viberNumber}`, "_blank", "noopener");
    });
  }
}

function getCSVUrl(url) {
  if (!url) return "";
  if (url.includes("/pub?") || url.includes("output=csv") || url.includes("format=csv")) {
    return url;
  }
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const docId = match[1];
    const gidMatch = url.match(/[?&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
  }
  return url;
}

/* ===========================================================
   Boot
=========================================================== */
async function init() {
  wireFooterLinks();
  wireLangToggle();
  updateUtilityBar();

  if (!CONFIG.SHEET_CSV_URL || CONFIG.SHEET_CSV_URL.includes("PASTE_YOUR")) {
    loadErrorEl.hidden = false;
    customizerSection.hidden = true;
    return;
  }

  renderSkeleton();

  try {
    await loadSettings();

    const csvUrl = getCSVUrl(CONFIG.SHEET_CSV_URL);
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    allProducts = rowsToProducts(parseCSV(text));
    renderFilters();
    renderShelf();
    buildCustomizer(allProducts);
    highlightSharedItem();
  } catch (err) {
    console.error("Failed to load product sheet:", err);
    loadErrorEl.hidden = false;
    customizerSection.hidden = true;
  }
}

init();
