/* Store catalog adapter for items and ranks. */
(() => {
    const items = window.MokioItems.items();
    const ranks = window.MokioRanks;
    const products = items;
    window.MokioStoreGrid = {
        catalogItems: () => [...products, ...ranks.catalogItems()],
        homeItems: () => [...products, ...ranks.homeItems()],
        products: () => products,
        chartPerks: ranks.chartPerks,
        resolveDetails: ranks.resolveDetails,
        saveCustomRank: ranks.saveCustomRank,
        setBilling: (key) => window.MokioRankTab.setBilling(key),
    };
})();
