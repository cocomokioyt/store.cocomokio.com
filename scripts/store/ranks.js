/* Rank catalog and custom-rank behavior shared by store pages. */
(() => {
    const FEATURED_BADGE = "Great Deal!";
    const DEFAULT_FACTS = [["Delivery", "Instantly in-game"]];
    const YEARLY_MONTHS_CHARGED = 10;
    const YEARLY_MONTHS_OFF = 12 - YEARLY_MONTHS_CHARGED;
    const monthsOffLabel = `${YEARLY_MONTHS_OFF} month${YEARLY_MONTHS_OFF === 1 ? "" : "s"}`;
    const PLANS = {
        month: { suffix: "", per: "30 days", label: "Every 30 days" },
        year: { suffix: "-y", per: "year", label: "Yearly" },
    };
    const RANKS = [
        { id: "r1", name: "Fish", price: 5.99, image: "Images/ranks/Fish.svg", blurb: "The perfect way to start. Chat with a brighter name and get more attention." },
        { id: "r2", name: "Crab", price: 11.99, image: "Images/ranks/Crab.svg", featured: true, blurb: "Great price for the perks if you want something cheaper." },
        { id: "r3", name: "JellyFish", price: 24.99, image: "Images/ranks/Jellyfish.svg", blurb: "Brighten chat with your chat colors and rank name." },
        { id: "r4", name: "Turtle", price: 31.99, image: "Images/ranks/Turtle.svg", blurb: "Kits, homes, and everything else you need." },
        { id: "r5", name: "Custom", price: 5.99, yearlyMonthsCharged: 11, blurb: "Design your own rank with the permissions you want. Pricing starts at $5.99 every 30 days and varies based on your selections." },
    ];
    const CUSTOM_RANKS_KEY = "cocomokio-custom-ranks";
    const money = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    const rankMonthsCharged = (rank) => rank.yearlyMonthsCharged ?? YEARLY_MONTHS_CHARGED;
    const rankMonthsOffLabel = (rank) => {
        const monthsOff = 12 - rankMonthsCharged(rank);
        return `${monthsOff} month${monthsOff === 1 ? "" : "s"}`;
    };
    const rankPrice = (rank, plan) => plan === "year"
        ? rank.yearly ?? +(rank.price * rankMonthsCharged(rank)).toFixed(2)
        : rank.price;
    const rankId = (rank, plan) => rank.id + PLANS[plan].suffix;
    const yearlySavings = (rank) => rank.price * 12 - rankPrice(rank, "year");
    const loadCustomRanks = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(CUSTOM_RANKS_KEY) || "{}");
            if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
            return Object.fromEntries(Object.entries(saved).filter(([id, item]) =>
                id.startsWith("custom-") && item?.id === id && Number.isFinite(item.price) && item.price >= 0));
        } catch {
            return {};
        }
    };
    const customRanks = loadCustomRanks();
    const catalogItems = () => [
        ...RANKS.flatMap((rank) => Object.entries(PLANS).map(([plan, details]) => ({
            id: rankId(rank, plan),
            name: `${rank.name} Rank${plan === "year" ? " (Yearly)" : ""}`,
            price: rankPrice(rank, plan),
            per: details.per,
            icon: "👑",
            image: rank.image,
            priceFrom: rank.id === "r5",
            badge: rank.featured ? FEATURED_BADGE : "",
            long: rank.blurb,
            rankId: rank.id,
            facts: [["Billing", plan === "year" ? `Once a year — ${rankMonthsOffLabel(rank)} off` : "Every 30 days"], ...DEFAULT_FACTS],
        }))),
        ...Object.values(customRanks),
    ];
    const homeItems = () => [
        ...RANKS.map((rank) => ({
            id: rank.id === "r5" ? rank.id : rankId(rank, "month"),
            name: rank.id === "r5" ? "Custom Rank" : `${rank.name} Rank`,
            desc: rank.blurb,
            price: rank.price,
            per: "30 days",
            priceFrom: rank.id === "r5",
            customRankBuilder: rank.id === "r5",
            image: rank.image,
            icon: "👑",
            badge: rank.featured ? FEATURED_BADGE : "",
            long: rank.blurb,
        })),
        ...Object.values(customRanks),
    ];
    let currentBilling = "month";
    const resolveDetails = (id) => {
        const rank = RANKS.find((entry) => entry.id === id);
        if (!rank) {
            const yearlyRank = RANKS.find((entry) => rankId(entry, "year") === id);
            return yearlyRank ? { id } : null;
        }
        if (rank.id === "r5") return { custom: true };
        return { id: rankId(rank, currentBilling) };
    };
    const saveCustomRank = (item) => {
        try {
            localStorage.setItem(CUSTOM_RANKS_KEY, JSON.stringify({ ...customRanks, [item.id]: item }));
        } catch {
            return false;
        }
        customRanks[item.id] = item;
        return true;
    };
    const chartPerks = (rankIdValue) => {
        const heading = document.querySelector(`[data-rank-table] th[data-rank="${rankIdValue}"]`);
        if (!heading) return [];
        return [...document.querySelectorAll("[data-rank-table] tbody tr")].flatMap((row) => {
            const label = row.querySelector("th").textContent.trim();
            const cell = row.cells[heading.cellIndex];
            if (cell.classList.contains("yes")) return [label];
            if (cell.classList.contains("no") || !cell.textContent.trim()) return [];
            return [`${label}: ${cell.textContent.trim()}`];
        });
    };

    window.MokioRanks = {
        catalogItems,
        homeItems,
        ranks: () => RANKS,
        plans: () => PLANS,
        currentBilling: () => currentBilling,
        setBilling: (key) => {
            if (PLANS[key]) currentBilling = key;
        },
        rankId,
        rankPrice,
        yearlySavings,
        rankPriceLabel: (rank, plan) => `${money(rankPrice(rank, plan))}${rank.id === "r5" ? "+" : ""}`,
        monthsOffLabel,
        featuredBadge: FEATURED_BADGE,
        saveCustomRank,
        chartPerks,
        resolveDetails,
    };
})();

            (() => {
                const BASE_PRICE = 5.99;
                const YEARLY_MONTHS_CHARGED = 11;
                const RANK_ITEMS = [
                    { id: "rankKit", label: "Daily rank kit", itemType: "Kit" },
                ];
                const ITEM_TIERS = [
                    { name: "Fish", price: 1 },
                    { name: "Crab", price: 2 },
                    { name: "JellyFish", price: 3 },
                    { name: "Turtle", price: 4 },
                ];
                const TOGGLES = [
                    { id: "fly", label: "Fly in lobby", price: 2 },
                    { id: "craft", label: "/craft", price: 2 },
                    { id: "anvilRepair", label: "/anvil and /repair", price: 2 },
                    { id: "enderChest", label: "/ec", price: 1 },
                ];
                const CHAT_COLORS = [
                    "Black", "Dark Blue", "Dark Green", "Dark Aqua", "Dark Red", "Dark Purple", "Gold", "Gray",
                    "Dark Gray", "Blue", "Green", "Aqua", "Red", "Light Purple", "Yellow", "White",
                ];
                const CHAT_COLOR_HEX = {
                    Black: "#000000", "Dark Blue": "#0000aa", "Dark Green": "#00aa00", "Dark Aqua": "#00aaaa",
                    "Dark Red": "#aa0000", "Dark Purple": "#aa00aa", Gold: "#ffaa00", Gray: "#aaaaaa",
                    "Dark Gray": "#555555", Blue: "#5555ff", Green: "#55ff55", Aqua: "#55ffff",
                    Red: "#ff5555", "Light Purple": "#ff55ff", Yellow: "#ffff55", White: "#ffffff",
                };
                const CHAT_COLOR_PRICE_PER_EXTRA = 0.25;
                const DEFAULT_KIT_COOLDOWN_HOURS = 24;
                const KIT_COOLDOWN_PRICE_PER_HOUR = 2;
                const QUANTITIES = [
                    { id: "teammates", label: "Teammates", min: 10, max: 30, pricePerUnit: 0.5, unit: "teammate" },
                    { id: "homes", label: "Homes", min: 3, max: 20, pricePerUnit: 0.5, unit: "home" },
                    { id: "ahListings", label: "AH Listings", min: 30, max: 60, pricePerUnit: 0.1, unit: "listing" },
                    { id: "orders", label: "Orders", min: 3, max: 10, pricePerUnit: 0.1, unit: "listing" },
                    { id: "playerVaults", label: "PlayerVaults", min: 2, max: 64, pricePerUnit: 0.5, unit: "vault" },
                ];
                const money = (amount) => new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount);
                const limitRankName = (value) => {
                    let characterCount = 0;
                    return (value.match(/&#[0-9a-f]{6}|./giu) || []).filter((part) => {
                        if (/^&#[0-9a-f]{6}$/i.test(part)) return true;
                        if (characterCount >= 12) return false;
                        characterCount += 1;
                        return true;
                    }).join("");
                };

                document.addEventListener("DOMContentLoaded", () => {
                    const form = document.querySelector("[data-custom-rank-form]");
                    if (!form) return;

                    const nameInput = form.querySelector("#custom-rank-name");
                    const kitCooldownInput = form.querySelector("[data-custom-cooldown]");
                    const previewColorSelect = form.querySelector("[data-custom-preview-color]");
                    const rankPreview = form.querySelector("[data-custom-preview-rank]");
                    const userPreview = form.querySelector("[data-custom-preview-user]");
                    const chatPreview = form.querySelector("[data-custom-chat-preview]");
                    const status = form.querySelector("[data-custom-status]");
                    let plan = "month";

                    const appendGradientText = (target, gradient) => {
                        const codePattern = /&#([0-9a-f]{6})/gi;
                        let currentColor = "";
                        let textStart = 0;
                        let match;
                        const appendText = (text) => {
                            if (!text) return;
                            const segment = document.createElement("span");
                            segment.textContent = text;
                            if (currentColor) segment.style.color = currentColor;
                            target.append(segment);
                        };

                        while ((match = codePattern.exec(gradient)) !== null) {
                            appendText(gradient.slice(textStart, match.index));
                            currentColor = `#${match[1]}`;
                            textStart = codePattern.lastIndex;
                        }
                        appendText(gradient.slice(textStart));
                    };
                    const renderRankPreview = (rankName) => {
                        const name = rankName || "My Rank";
                        const colors = [...name.matchAll(/&#([0-9a-f]{6})/gi)].map((match) => `#${match[1]}`);
                        const appendBracket = (text, color) => {
                            if (!color) {
                                rankPreview.append(text);
                                return;
                            }
                            const bracket = document.createElement("span");
                            bracket.textContent = text;
                            bracket.style.color = color;
                            rankPreview.append(bracket);
                        };

                        rankPreview.replaceChildren();
                        appendBracket("[", colors[0]);
                        appendGradientText(rankPreview, name);
                        appendBracket("]", colors[colors.length - 1]);
                        userPreview.style.color = colors[colors.length - 1] || "";
                    };
                    const renderPreviewColors = (selectedColors) => {
                        const selectedColor = selectedColors.includes(previewColorSelect.value)
                            ? previewColorSelect.value
                            : selectedColors[0];
                        previewColorSelect.replaceChildren(...selectedColors.map((color) => {
                            const option = document.createElement("option");
                            option.value = color;
                            option.textContent = color;
                            option.selected = color === selectedColor;
                            return option;
                        }));
                        chatPreview.style.color = CHAT_COLOR_HEX[selectedColor] || CHAT_COLOR_HEX.White;
                    };

                    form.querySelector("[data-custom-rank-items]").innerHTML = RANK_ITEMS.map((item) => `
                        <label class="custom-permission" for="custom-${item.id}">
                            <span><strong>${item.label}</strong><small>Choose a rank tier; price is added monthly</small></span>
                            <select id="custom-${item.id}" data-custom-rank-item="${item.id}" aria-label="${item.label}">
                                <option value="">No ${item.itemType.toLowerCase()}</option>
                                ${ITEM_TIERS.map((tier) => {
                                    return `<option value="${tier.name}">${tier.name} ${item.itemType} (+${money(tier.price)}/30 days)</option>`;
                                }).join("")}
                            </select>
                        </label>`).join("");
                    form.querySelector("[data-custom-toggles]").innerHTML = TOGGLES.map((permission) => `
                        <label class="custom-permission">
                            <span><strong>${permission.label}</strong><small>+${money(permission.price)} / 30 days</small></span>
                            <input type="checkbox" data-custom-toggle="${permission.id}" aria-label="Add ${permission.label}">
                        </label>`).join("");
                    form.querySelector("[data-custom-colors]").innerHTML = `
                        <div class="custom-color-picker">
                            <span class="custom-color-heading">
                                <strong>Chat colors</strong>
                                <small>Choose which colors your rank includes</small>
                            </span>
                            <details class="custom-color-dropdown">
                                <summary data-custom-color-summary>1 color selected</summary>
                                <div class="custom-color-options" role="group" aria-label="Choose chat colors">
                                    ${CHAT_COLORS.map((color) => `
                                        <label class="custom-color-option">
                                            <input type="checkbox" value="${color}" data-custom-color${color === "White" ? " checked" : ""}>
                                            <span>${color}</span>
                                        </label>`).join("")}
                                </div>
                            </details>
                            <small class="custom-color-price">+${money(CHAT_COLOR_PRICE_PER_EXTRA)} per color above 1 / 30 days</small>
                        </div>`;
                    form.querySelector("[data-custom-quantities]").innerHTML = QUANTITIES.map((permission) => `
                        <label class="custom-permission custom-permission-range" for="custom-${permission.id}">
                            <span>
                                <strong>Total ${permission.label}: <output data-custom-quantity-value="${permission.id}">${permission.min}</output></strong>
                                <small>Includes ${permission.min}; +${money(permission.pricePerUnit)} / 30 days per additional ${permission.unit}</small>
                            </span>
                            <input id="custom-${permission.id}" type="range" min="${permission.min}" max="${permission.max}" step="1" value="${permission.min}" data-custom-quantity="${permission.id}" aria-label="Total ${permission.label}">
                        </label>`).join("");

                    const selectedRankItems = () => RANK_ITEMS.flatMap((item) => {
                        const tierName = form.querySelector(`[data-custom-rank-item="${item.id}"]`).value;
                        const tier = ITEM_TIERS.find((option) => option.name === tierName);
                        const price = tier?.price;
                        return tier && price !== undefined ? [{ detail: `${tier.name} ${item.itemType}`, price }] : [];
                    });
                    const selectedChatColors = () => [...form.querySelectorAll("[data-custom-color]:checked")]
                        .map((input) => input.value);
                    const monthlyPrice = () => Math.round((BASE_PRICE
                        + TOGGLES.reduce((sum, permission) =>
                            sum + (form.querySelector(`[data-custom-toggle="${permission.id}"]`).checked ? permission.price : 0), 0)
                        + selectedRankItems().reduce((sum, item) => sum + item.price, 0)
                        + Math.max(0, selectedChatColors().length - 1) * CHAT_COLOR_PRICE_PER_EXTRA
                        + (DEFAULT_KIT_COOLDOWN_HOURS - Number(kitCooldownInput.value)) * KIT_COOLDOWN_PRICE_PER_HOUR
                        + QUANTITIES.reduce((sum, permission) => {
                            const value = Number(form.querySelector(`[data-custom-quantity="${permission.id}"]`).value);
                            return sum + (value - permission.min) * permission.pricePerUnit;
                        }, 0)) * 100) / 100;
                    const update = () => {
                        const rankName = nameInput.value.trim() || "My Rank";
                        const plainRankName = rankName.replace(/&#[0-9a-f]{6}/gi, "");
                        const monthlyTotal = monthlyPrice();
                        const price = plan === "year" ? Math.round(monthlyTotal * YEARLY_MONTHS_CHARGED * 100) / 100 : monthlyTotal;
                        const selectedColors = selectedChatColors();
                        form.querySelector("[data-custom-name-preview]").textContent = plainRankName;
                        renderRankPreview(rankName);
                        form.querySelector("[data-custom-name-summary]").textContent = plainRankName;
                        renderPreviewColors(selectedColors);
                        form.querySelector("[data-custom-color-summary]").textContent =
                            `${selectedColors.length} ${selectedColors.length === 1 ? "color" : "colors"} selected`;
                        QUANTITIES.forEach((permission) => {
                            form.querySelector(`[data-custom-quantity-value="${permission.id}"]`).textContent =
                                form.querySelector(`[data-custom-quantity="${permission.id}"]`).value;
                        });
                        const cooldownHours = Number(kitCooldownInput.value);
                        const cooldownReductionPrice =
                            (DEFAULT_KIT_COOLDOWN_HOURS - cooldownHours) * KIT_COOLDOWN_PRICE_PER_HOUR;
                        form.querySelector("[data-custom-cooldown-value]").textContent = `${cooldownHours} hours`;
                        form.querySelector("[data-custom-cooldown-price]").textContent = cooldownReductionPrice
                            ? `+${money(cooldownReductionPrice)} / 30 days`
                            : "Included free";
                        form.querySelector("[data-custom-total]").textContent = `${money(price)} per ${plan}`;
                        form.querySelector("[data-custom-price-note]").textContent = plan === "year"
                            ? `Save ${money(monthlyTotal)} per year (1 month off).`
                            : `Starting at ${money(BASE_PRICE)} every 30 days.`;
                        form.querySelectorAll("[data-custom-plan]").forEach((button) =>
                            button.setAttribute("aria-pressed", String(button.dataset.customPlan === plan)));
                    };

                    nameInput.addEventListener("input", () => {
                        const limitedName = limitRankName(nameInput.value);
                        if (limitedName !== nameInput.value) nameInput.value = limitedName;
                    });
                    form.addEventListener("input", update);
                    form.addEventListener("change", (event) => {
                        if (event.target.matches("[data-custom-color]")) {
                            const selectedColors = selectedChatColors();
                            if (!selectedColors.length) {
                                event.target.checked = true;
                                status.textContent = "Select at least one chat color.";
                            } else {
                                status.textContent = "";
                            }
                        }
                        update();
                    });
                    form.querySelectorAll("[data-custom-plan]").forEach((button) => {
                        button.addEventListener("click", () => {
                            plan = button.dataset.customPlan;
                            status.textContent = "";
                            update();
                        });
                    });
                    form.addEventListener("submit", (event) => {
                        event.preventDefault();
                        const rankName = nameInput.value.trim();
                        const plainRankName = rankName.replace(/&#[0-9a-f]{6}/gi, "");
                        if (!plainRankName) {
                            nameInput.setCustomValidity("Enter a name for your custom rank.");
                            nameInput.reportValidity();
                            return;
                        }
                        if ([...plainRankName].length > 12) {
                            nameInput.setCustomValidity("Your custom rank name must be 12 characters or fewer, not including color codes.");
                            nameInput.reportValidity();
                            return;
                        }
                        nameInput.setCustomValidity("");

                        const monthlyTotal = monthlyPrice();
                        const price = plan === "year" ? Math.round(monthlyTotal * YEARLY_MONTHS_CHARGED * 100) / 100 : monthlyTotal;
                        const selectedItems = selectedRankItems()
                            .map((item) => `${item.detail} (+${money(item.price)}/30 days)`);
                        const selectedToggles = TOGGLES
                            .filter((permission) => form.querySelector(`[data-custom-toggle="${permission.id}"]`).checked)
                            .map((permission) => `${permission.label} (+${money(permission.price)}/30 days)`);
                        const selectedColors = selectedChatColors();
                        const rankNameGradient = /&#[0-9a-f]{6}/i.test(rankName);
                        const kitCooldownHours = Number(kitCooldownInput.value);
                        const quantities = Object.fromEntries(QUANTITIES.map((permission) => [
                            permission.id,
                            Number(form.querySelector(`[data-custom-quantity="${permission.id}"]`).value),
                        ]));
                        const quantityDetails = QUANTITIES.map((permission) => `Total ${permission.label}: ${quantities[permission.id]}`);
                        const selections = [
                            ...selectedItems,
                            ...selectedToggles,
                            `Chat colors: ${selectedColors.join(", ")}`,
                            ...(rankNameGradient ? [`Rank name gradient: ${rankName}`] : []),
                            `Kit cooldown: ${kitCooldownHours} hours${kitCooldownHours < DEFAULT_KIT_COOLDOWN_HOURS
                                ? ` (+${money((DEFAULT_KIT_COOLDOWN_HOURS - kitCooldownHours) * KIT_COOLDOWN_PRICE_PER_HOUR)}/30 days)`
                                : " (included free)"}`,
                            ...quantityDetails,
                        ];
                        const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
                        const item = {
                            id,
                            name: `Custom Rank \u2014 ${plainRankName}`,
                            price,
                            per: plan,
                            icon: "\u{1F451}",
                            customSummary: `Custom rank name: ${plainRankName} \u00b7 ${selections.join(" \u00b7 ")}`,
                            long: "A player-configured custom rank with the selected permissions and quantities.",
                            facts: [
                                ["Rank type", "Custom Rank"],
                                ["Custom rank name", plainRankName],
                                ["Billing", plan === "year" ? "Once a year \u2014 1 month off" : "Every 30 days"],
                                ["Monthly equivalent", `${money(monthlyTotal)} / month`],
                                ...selections.map((selection, index) => [`Selection ${index + 1}`, selection]),
                            ],
                        };

                        if (!window.MokioStore?.addCustomRank(item)) {
                            status.textContent = "Could not save your custom rank in this browser. Check storage settings and try again.";
                            return;
                        }
                        status.textContent = "Custom rank added to your cart.";
                    });
                    update();
                }, { once: true });
            })();
