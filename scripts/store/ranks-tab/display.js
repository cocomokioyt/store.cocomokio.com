/* Presentation for the rank cards shown in the store's Ranks tab. */
(() => {
    const { url } = window.Mokio;
    const ranks = window.MokioRanks;
    const element = document.querySelector('[data-store-view="ranks"]');
    if (!element) return;

    const renderRankCard = (rank, plan) => rank.id === "r5" ? `
        <a class="tier custom-rank-link" href="https://store.cocomokio.com/pages/custom-rank.html">
            <h3>${rank.name}</h3>
            <div class="rank-price">${ranks.rankPriceLabel(rank, plan)} <small>starting per ${ranks.plans()[plan].per}</small></div>
            <div class="rank-note">${plan === "year" ? "1 month off" : "&nbsp;"}</div>
            <p>${rank.blurb}</p>
            <span class="button-like">Build your rank</span>
        </a>` : `
        <div class="tier${rank.featured ? " featured" : ""}" data-act="details" data-id="${ranks.rankId(rank, plan)}">
            ${rank.featured ? `<span class="badge">${ranks.featuredBadge}</span>` : ""}
            <img class="tier-image" src="${url(rank.image)}" alt="${rank.name} Rank">
            <h3><button class="title-btn" data-act="details" data-id="${ranks.rankId(rank, plan)}">${rank.name}</button></h3>
            <div class="rank-price">${ranks.rankPriceLabel(rank, plan)} <small>per ${ranks.plans()[plan].per}</small></div>
            <div class="rank-note">${plan === "year" ? `Save ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(ranks.yearlySavings(rank))}` : "&nbsp;"}</div>
            <p>${rank.blurb}</p>
            <button data-act="add" data-id="${ranks.rankId(rank, plan)}" aria-label="Add ${rank.name} Rank (${ranks.plans()[plan].label}) to cart">Add to cart</button>
        </div>`;
    const render = () => {
        const plan = ranks.currentBilling();
        element.innerHTML = `
            <div class="store-hero"><div><h2>Server Ranks</h2><p>Compare every rank side by side and pick the one that fits you.</p></div></div>
            <div class="toolbar">
                <span class="grey">${ranks.ranks().length} ranks</span>
                <div class="billing-toggle" role="group" aria-label="Billing period">
                    ${Object.entries(ranks.plans()).map(([key, details]) => `
                        <button data-act="billing" data-id="${key}" aria-pressed="${key === plan}">
                            ${details.label}${key === "year" ? ` <span class="save">Up to ${ranks.monthsOffLabel} free</span>` : ""}
                        </button>`).join("")}
                </div>
            </div>
            <div class="tier-grid">${ranks.ranks().map((rank) => renderRankCard(rank, plan)).join("")}</div>`;
    };

    render();
    window.MokioRankTab = {
        setBilling(key) {
            if (!ranks.plans()[key]) return;
            ranks.setBilling(key);
            render();
        },
    };
})();
