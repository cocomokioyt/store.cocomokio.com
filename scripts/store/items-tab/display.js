/* Presentation for buyable item cards in the store's Items tab. */
(() => {
    const { url } = window.Mokio;
    const element = document.querySelector('[data-store-view="items"]');
    if (!element) return;

    const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
    const money = (amount) => new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
    const items = window.MokioStoreGrid.products().filter((item) => item.cat === "items");
    const renderItem = (item) => `
        <div class="product" data-act="details" data-id="${esc(item.id)}">
            <div class="product-media">
                ${item.badge ? `<span class="badge">${esc(item.badge)}</span>` : ""}
                ${item.image
                    ? `<img class="${item.id.startsWith("key-") ? "key-image" : ""}" src="${url(item.image)}" alt="${esc(item.name)}">`
                    : `<span aria-hidden="true">${item.icon || "🛍️"}</span>`}
            </div>
            <div class="product-body">
                <h3><button class="title-btn" data-act="details" data-id="${esc(item.id)}">${esc(item.name)}</button></h3>
                <p>${esc(item.desc || item.long || "")}</p>
                <div class="product-foot">
                    <span class="price">${money(item.price)}${item.priceFrom ? "+" : ""}${item.was ? ` <s>${money(item.was)}</s>` : ""}${item.per ? ` <small>/ ${esc(item.per)}</small>` : ""}</span>
                    <button data-act="add" data-id="${esc(item.id)}" aria-label="Add ${esc(item.name)} to cart">Add to cart</button>
                </div>
            </div>
        </div>`;

    element.innerHTML = `
        <div class="section-head"><h2>Items</h2></div>
        <div class="toolbar"><span class="grey">${items.length} items</span></div>
        <div class="product-grid items-product-grid">
            ${items.length ? items.map(renderItem).join("") : '<div class="empty-state">Nothing here yet — check back soon!</div>'}
        </div>`;
})();
