/* =========================================================
   CoCoMokio store — cart and general product page templates.
   Product catalog data lives in store-grid.js; rank data lives in store/ranks.js.
   Page URLs/titles/icons live in site.js (CATEGORIES).
   The rank comparison chart is plain HTML in pages/store/ranks.html.
   ========================================================= */
(() => {
    const { url, CATEGORIES, user } = window.Mokio;

    /* ---------- DATA ---------- */
    const storeGrid = window.MokioStoreGrid;
    const PRODUCTS = storeGrid.products();

    /* One lookup for everything that can be opened in details or put in the cart. */
    const CATALOG = new Map([
        ...storeGrid.catalogItems(),
    ].map((item) => [item.id, item]));

    /* ---------- HELPERS ---------- */
    const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
    const itemPriceLabel = (item) => `${money(item.price)}${item.priceFrom ? "+" : ""}`;
    const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);
    const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

    /* ---------- CART (saved in this browser) ---------- */
    const KEY = "cocomokio-cart";
    const SERVER_CHOICES_KEY = "cocomokio-cart-server-choices";
    const loadCart = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
    let cart = loadCart();
    const loadServerChoices = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(SERVER_CHOICES_KEY) || "{}");
            return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
        } catch {
            return {};
        }
    };
    const serverChoices = loadServerChoices();

    const lines = () => Object.entries(cart)
        .filter(([id]) => CATALOG.has(id))
        .map(([id, qty]) => ({ id, qty, item: CATALOG.get(id) }));
    const count = () => lines().reduce((sum, l) => sum + l.qty, 0);
    const subtotal = () => lines().reduce((sum, l) => sum + l.item.price * l.qty, 0);

    function updateBadge() {
        const badge = document.querySelector(".cart-count");
        if (!badge) return;
        badge.textContent = count();
        badge.classList.toggle("has-items", count() > 0);
    }

    function setQty(id, qty) {
        if (qty > 0) cart[id] = qty;
        else {
            delete cart[id];
            delete serverChoices[id];
            try { localStorage.setItem(SERVER_CHOICES_KEY, JSON.stringify(serverChoices)); } catch { /* selection lasts for this page only */ }
        }
        try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* storage blocked: cart lasts for this page only */ }
        updateBadge();
    }

    const serverChoice = (id, item) => item.serverOptions?.includes(serverChoices[id])
        ? serverChoices[id]
        : "None";
    const hasRequiredServerChoices = () => lines().every(({ id, item }) =>
        !item.serverOptions || item.serverOptions.includes(serverChoices[id]));

    let toastTimer;
    function toast(message) {
        let el = document.querySelector(".toast");
        if (!el) {
            el = Object.assign(document.createElement("div"), { className: "toast" });
            el.setAttribute("role", "status");
            document.body.append(el);
        }
        el.textContent = message;
        el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
    }

    /* ---------- TEMPLATES ---------- */
    const tplMedia = (item) => item.image
        ? `<img${item.id.startsWith("key-") ? ' class="key-image"' : ""} src="${url(item.image)}" alt="${esc(item.name)}">`
        : `<span aria-hidden="true">${item.icon}</span>`;

    /* Clicking anywhere on the card (or its title) opens the details. */
    const tplProduct = (p) => `
        <div class="product" data-act="details" data-id="${p.id}">
            <div class="product-media">
                ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
                ${tplMedia(p)}
            </div>
            <div class="product-body">
                <h3><button class="title-btn" data-act="details" data-id="${p.id}">${esc(p.name)}</button></h3>
                <p>${esc(p.desc || p.long || "")}</p>
                <div class="product-foot">
                    <span class="price">${money(p.price)}${p.priceFrom ? "+" : ""}${p.was ? `<s>${money(p.was)}</s>` : ""}${p.per ? ` <small>/ ${p.per}</small>` : ""}</span>
                    <button data-act="${p.customRankBuilder ? "details" : "add"}" data-id="${p.id}" aria-label="${p.customRankBuilder ? "Build" : "Add"} ${esc(p.name)}${p.customRankBuilder ? "" : " to cart"}">${p.customRankBuilder ? "Build your rank" : "Add to cart"}</button>
                </div>
            </div>
        </div>`;

    /* The "more details" popup content — used for products and ranks. */
    const tplDetails = (item) => `
        <button class="modal-close" data-act="close" aria-label="Close details">×</button>
        <div class="modal-media">${tplMedia(item)}</div>
        <div class="modal-body">
            ${item.badge ? `<span class="badge static">${esc(item.badge)}</span>` : ""}
            <h2 id="modal-title">${esc(item.name)}</h2>
            <p class="price">${itemPriceLabel(item)}${item.per ? ` <small>/ ${item.per}</small>` : ""}</p>
            <p>${esc(item.long || item.desc)}</p>
            ${item.includes?.length ? `<h3>What you get</h3><ul class="checklist">${item.includes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
            <dl class="facts">${(item.facts || DEFAULT_FACTS).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
            <div class="modal-actions">
                <button data-act="add" data-id="${item.id}">Add to cart</button>
                <button class="btn-secondary" data-act="close">Keep browsing</button>
            </div>
        </div>`;

    const tplEmpty = (html) => `<div class="empty-state">${html}</div>`;
    const tplHero = (heading, blurb, extra = "") =>
        `<div class="store-hero"><div><h2>${esc(heading)}</h2><p>${esc(blurb)}</p></div>${extra}</div>`;
    const tplSectionHead = (title, href, linkText = "View all →") =>
        `<div class="section-head"><h2>${esc(title)}</h2>${href ? `<a href="${href}">${linkText}</a>` : ""}</div>`;
    const tplCategoryCard = ({ icon, title, blurb, page }) =>
        `<a class="category-card" href="${page}"><div class="icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(blurb)}</p></a>`;

    /* ---------- VIEWS (picked by data-store-view on the page) ---------- */
    let redraw = () => {};     // set by views that must refresh after a cart change
    const views = {
        home(el) {
            el.innerHTML = `
                ${tplHero("Welcome to the Mokio Store", "Support the server — grab ranks and in-game items.",
                    `<a class="btn" href="${CATEGORIES.ranks.page}">Browse ranks</a>`)}
                <div class="category-grid">${Object.values(CATEGORIES).map(tplCategoryCard).join("")}</div>
                ${tplSectionHead("All ranks and items")}
                <div class="product-grid">${storeGrid.homeItems().map(tplProduct).join("")}</div>`;
        },

        grid(el) {
            const SORTS = {
                default: null,
                low:  (a, b) => a.price - b.price,
                high: (a, b) => b.price - a.price,
                az:   (a, b) => a.name.localeCompare(b.name),
            };
            const category = el.dataset.category;
            const items = PRODUCTS.filter((p) => p.cat === category);
            const sortControl = category === "items" ? "" : `
                <label>Sort by
                    <select data-sort>
                        <option value="default">Featured</option>
                        <option value="low">Price: low to high</option>
                        <option value="high">Price: high to low</option>
                        <option value="az">Name: A–Z</option>
                    </select>
                </label>`;

            el.innerHTML = `
                ${tplSectionHead(CATEGORIES[category].title)}
                <div class="toolbar">
                    <span class="grey">${plural(items.length, "item")}</span>
                    ${sortControl}
                </div>
                <div class="product-grid"></div>`;

            const grid = el.querySelector(".product-grid");
            const draw = (sort = "default") => {
                const sorted = SORTS[sort] ? [...items].sort(SORTS[sort]) : items;
                grid.innerHTML = sorted.length ? sorted.map(tplProduct).join("") : tplEmpty("Nothing here yet — check back soon!");
            };
            const sortSelect = el.querySelector("[data-sort]");
            if (sortSelect) sortSelect.addEventListener("change", (event) => draw(event.target.value));
            draw();
        },

        checkout(el) {
            const row = ({ id, qty, item }) => `
                <div class="cart-row">
                    <div class="cart-thumb" aria-hidden="true">${item.icon || "🛒"}</div>
                    <div>
                        <h3>${esc(item.name)}</h3>
                        <small>${itemPriceLabel(item)}${item.per ? ` / ${item.per}` : ""}</small>
                        ${item.customSummary ? `<small class="cart-custom-summary">${esc(item.customSummary)}</small>` : ""}
                        ${item.serverOptions ? `
                            <div class="field cart-server-field">
                                <label for="server-${esc(id)}">Server</label>
                                <select id="server-${esc(id)}" data-server-choice="${esc(id)}" aria-label="Select server for ${esc(item.name)}">
                                    <option value="None"${serverChoice(id, item) === "None" ? " selected" : ""}>None — select a server</option>
                                    ${item.serverOptions.map((server) => `<option value="${esc(server)}"${serverChoice(id, item) === server ? " selected" : ""}>${esc(server)}</option>`).join("")}
                                </select>
                            </div>` : ""}
                    </div>
                    <div class="qty">
                        <button data-act="dec" data-id="${id}" aria-label="Decrease quantity">−</button>
                        <span>${qty}</span>
                        <button data-act="inc" data-id="${id}" aria-label="Increase quantity">+</button>
                    </div>
                    <div><strong>${money(item.price * qty)}</strong> <button class="link-btn" data-act="rm" data-id="${id}">Remove</button></div>
                </div>`;

            redraw = () => {
                // keep anything typed in the form when the cart re-renders
                const typed = (id) => el.querySelector(id)?.value;
                const name = typed("#mc-name") ?? user.get();
                const email = typed("#mc-email") ?? "";
                const items = lines();
                if (!items.length) {
                    el.innerHTML = `<div class="panel">${tplEmpty(`Your cart is empty.<br><br><a class="btn" href="https://store.cocomokio.com/">Back to the store</a>`)}</div>`;
                    return;
                }
                el.innerHTML = `
                    <div class="checkout-layout">
                        <div class="panel">
                            <h2>Your cart (${count()})</h2>
                            ${items.map(row).join("")}
                        </div>
                        <div class="panel">
                            <h2>Order summary</h2>
                            <div class="summary-line"><span>Subtotal</span><span>${money(subtotal())}</span></div>
                            <div class="summary-line"><span>Tax</span><span>Calculated at payment</span></div>
                            <div class="summary-line total"><span>Total</span><span>${money(subtotal())}</span></div>
                            <div class="field"><label for="mc-name">In-game username</label><input id="mc-name" autocomplete="off" placeholder="e.g. CoCoMokio" value="${esc(name)}"></div>
                            <div class="field"><label for="mc-email">Email for receipt</label><input id="mc-email" type="email" placeholder="you@example.com" value="${esc(email)}"></div>
                            <button class="wide" data-act="pay"${hasRequiredServerChoices() ? "" : " disabled"}>Proceed to payment</button>
                            ${hasRequiredServerChoices() ? "" : '<p class="note server-required-note">Select a server for every key, kit, and Elytra before proceeding.</p>'}
                            <p class="note">Payments aren't connected yet — hook this button up to your payment provider (Stripe, Tebex, PayPal).</p>
                        </div>
                    </div>`;
            };
            redraw();
        },
    };

    /* ---------- DETAILS DIALOG ---------- */
    let dialog;
    function openDetails(id) {
        if (!CATALOG.has(id)) return;
        if (!dialog) {
            dialog = Object.assign(document.createElement("dialog"), { className: "modal" });
            dialog.setAttribute("aria-labelledby", "modal-title");
            dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }); // click on the backdrop
            document.body.append(dialog);
        }
        const item = CATALOG.get(id);
        dialog.innerHTML = tplDetails(item.rankId
            ? { ...item, includes: storeGrid.chartPerks(item.rankId) }
            : item);
        dialog.showModal();
    }

    /* ---------- ACTIONS ---------- */
    const change = (id, delta) => setQty(id, (cart[id] || 0) + delta);
    function addCustomRank(item) {
        if (!item || typeof item.id !== "string" || !item.id.startsWith("custom-")
            || typeof item.name !== "string" || !Number.isFinite(item.price) || item.price < 0
            || !["month", "year"].includes(item.per)) {
            throw new Error("Invalid custom rank cart item.");
        }

        if (!storeGrid.saveCustomRank(item)) return false;
        CATALOG.set(item.id, item);
        change(item.id, 1);
        toast(`${item.name} added to cart`);
        return true;
    }

    window.MokioStore = { addCustomRank };

    const actions = {
        details: (id) => {
            const rankAction = storeGrid.resolveDetails(id);
            if (rankAction?.custom) {
                location.href = "https://store.cocomokio.com/pages/custom-rank.html";
                return;
            }
            openDetails(rankAction?.id || id);
        },
        billing: (key) => storeGrid.setBilling(key),
        close: () => dialog?.close(),
        add: (id) => { change(id, 1); dialog?.close(); toast(`${CATALOG.get(id).name} added to cart`); },
        inc: (id) => change(id, 1),
        dec: (id) => change(id, -1),
        rm:  (id) => setQty(id, 0),
        pay: () => {
            if (!hasRequiredServerChoices()) {
                toast("Select a server for every key, kit, and Elytra before proceeding.");
                return;
            }
            toast("Payment isn't set up yet");
        },
    };

    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-act]");
        if (!button) return;
        actions[button.dataset.act]?.(button.dataset.id);
        redraw();
    });

    document.addEventListener("change", (event) => {
        const select = event.target.closest("[data-server-choice]");
        if (!select) return;
        const id = select.dataset.serverChoice;
        const item = CATALOG.get(id);
        if (!item?.serverOptions) return;
        serverChoices[id] = item.serverOptions.includes(select.value) ? select.value : "None";
        try { localStorage.setItem(SERVER_CHOICES_KEY, JSON.stringify(serverChoices)); } catch { /* selection lasts for this page only */ }
        redraw();
    });

    // keep the cart in sync if it changes in another tab
    addEventListener("storage", (event) => {
        if (event.key !== KEY && event.key !== SERVER_CHOICES_KEY) return;
        if (event.key === KEY) cart = loadCart();
        if (event.key === SERVER_CHOICES_KEY) {
            const latestChoices = loadServerChoices();
            Object.keys(serverChoices).forEach((id) => delete serverChoices[id]);
            Object.assign(serverChoices, latestChoices);
        }
        updateBadge();
        redraw();
    });

    /* ---------- BOOT ---------- */
    const page = document.querySelector("[data-store-view]");
    if (page) views[page.dataset.storeView]?.(page);
    updateBadge();
})();
