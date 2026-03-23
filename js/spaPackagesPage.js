(() => {
  const input = document.getElementById("pkgSearch");
  const clearBtn = document.getElementById("pkgClearBtn");
  const accs = Array.from(document.querySelectorAll(".pkg-acc"));
  const items = Array.from(document.querySelectorAll(".pkg-item"));
  const groups = Array.from(document.querySelectorAll("[data-pkg-group]")); // subsection wrappers

  if (!input || items.length === 0) return;

  // --- normalize / tokenize ---
  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const splitTokens = (s) => normalize(s).split(" ").filter(Boolean);

  // --- synonyms + intent expansion ---
  // If a user types "head", treat it like searching face/lip/chin/neck, etc.
  const INTENTS = {
    head: ["face", "lower face", "upper lip", "chin", "neck", "jaw", "lip", "forehead"],
    face: ["face", "lower face", "chin", "upper lip", "neck"],
    underarm: ["underarms", "under arm", "armpit", "armpits"],
    bikini: ["bikini", "brazilian", "hollywood"],
    legs: ["leg", "lower leg", "full leg", "thigh", "calf"],
    arms: ["arm", "underarms", "upper arms", "forearms"],
    chest: ["chest", "areola"],
    back: ["back"],
    bundle: ["bundle", "combo", "any 3", "package", "series"],
  };

  // quick alias map (single-token typos / variants)
  const ALIASES = {
    brazillian: "brazilian",
    underarm: "underarms",
    underarms: "underarms",
    armpit: "underarms",
    armpits: "underarms",
    lip: "upper lip",
    neck: "neck",
  };

  function expandQueryTokens(rawQuery) {
    let t = splitTokens(rawQuery).map(x => ALIASES[x] || x);

    // add intent expansions if token matches a key
    const extras = [];
    for (const token of t) {
      if (INTENTS[token]) extras.push(...INTENTS[token]);
    }

    // also support 2-word intent like "upper body" / "lower body"
    const qNorm = normalize(rawQuery);
    if (qNorm.includes("upper body")) extras.push("upper arms", "underarms", "areola", "chest", "back");
    if (qNorm.includes("lower body")) extras.push("bikini", "brazilian", "full leg", "lower leg");

    return Array.from(new Set([...t, ...splitTokens(extras.join(" "))]));
  }

  // --- matching ---
  // prefix token match: query token can match the beginning of any keyword token
  function tokenPrefixMatch(qTokens, hayTokens) {
    if (qTokens.length === 0) return true;
    const hay = hayTokens;

    return qTokens.every((qt) => {
      // allow 1-letter queries like "f" -> face
      if (qt.length === 1) {
        return hay.some(ht => ht.startsWith(qt));
      }
      // normal prefix match
      return hay.some((ht) => ht.startsWith(qt));
    });
  }

  // Create suggestions bar
  let suggestBar = document.getElementById("pkgSuggestBar");
  if (!suggestBar) {
    suggestBar = document.createElement("div");
    suggestBar.id = "pkgSuggestBar";
    suggestBar.className = "pkg-suggest";
    suggestBar.style.display = "none";
    const toolbar = document.querySelector(".pkg-toolbar .container");
    toolbar?.appendChild(suggestBar);
  }

  function setSuggestBar(html) {
    if (!suggestBar) return;
    suggestBar.innerHTML = html || "";
    suggestBar.style.display = html ? "block" : "none";
  }

  // Lightweight similarity for suggestions (not used for main filtering)
  function levenshtein(a, b) {
    a = normalize(a); b = normalize(b);
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = temp;
      }
    }
    return dp[n];
  }
  function similarity(a, b) {
    a = normalize(a); b = normalize(b);
    const maxLen = Math.max(a.length, b.length) || 1;
    return 1 - (levenshtein(a, b) / maxLen);
  }

  // Build item index once
  const index = items.map((el) => {
    const k = el.getAttribute("data-keywords") || "";
    const title = el.querySelector("[data-title]")?.innerText
      || el.querySelector("h4")?.innerText
      || el.innerText
      || "";
    const hay = normalize(`${k} ${title}`);
    return {
      el,
      title: title.trim(),
      hayTokens: splitTokens(hay),
      hayRaw: hay,
    };
  });

  function applyFilter() {
    const raw = input.value;
    const q = normalize(raw);
    const hasQuery = q.length > 0;

    setSuggestBar("");

    const qTokens = hasQuery ? expandQueryTokens(raw) : [];

    let matchCount = 0;

    index.forEach(({ el, hayTokens }) => {
      const match = !hasQuery || tokenPrefixMatch(qTokens, hayTokens);
      el.style.display = match ? "" : "none";
      if (match) matchCount++;
    });

    // open relevant accordions while searching
    if (hasQuery) {
      accs.forEach((acc) => {
        const visibleCount = Array.from(acc.querySelectorAll(".pkg-item"))
          .filter((it) => it.style.display !== "none").length;
        acc.open = visibleCount > 0;
      });
    }

    // hide/show subsection wrappers (Laser Hair headings)
    groups.forEach((g) => {
      const visibleCount = Array.from(g.querySelectorAll(".pkg-item"))
        .filter((it) => it.style.display !== "none").length;
      g.style.display = visibleCount > 0 ? "" : "none";
    });

    // suggestions when nothing matched
    if (hasQuery && matchCount === 0) {
      const scored = index
        .map(({ el, title, hayRaw }) => ({
          el, title,
          score: Math.max(similarity(q, title), similarity(q, hayRaw)),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .filter(x => x.score >= 0.35);

      if (scored.length) {
        // show top suggestions
        scored.forEach(({ el }) => (el.style.display = ""));
        // ensure groups show if a suggestion is inside them
        groups.forEach((g) => {
          const visibleCount = Array.from(g.querySelectorAll(".pkg-item"))
            .filter((it) => it.style.display !== "none").length;
          g.style.display = visibleCount > 0 ? "" : "none";
        });

        const pills = scored.map(({ title }) =>
          `<button class="pkg-suggest-pill" type="button" data-suggest="${title.replace(/"/g, "&quot;")}">${title}</button>`
        ).join("");

        setSuggestBar(`
          <div class="pkg-suggest-inner">
            <div class="pkg-suggest-text">No exact matches. Try:</div>
            <div class="pkg-suggest-pills">${pills}</div>
          </div>
        `);

        suggestBar.querySelectorAll("[data-suggest]").forEach(btn => {
          btn.addEventListener("click", () => {
            input.value = btn.getAttribute("data-suggest") || "";
            applyFilter();
            const firstVisible = items.find(it => it.style.display !== "none");
            firstVisible?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        });
      } else {
        setSuggestBar(`
          <div class="pkg-suggest-inner">
            <div class="pkg-suggest-text">
              No matches. Try: face, head, underarms, bikini, legs, bundle.
            </div>
          </div>
        `);
      }
    }

    if (clearBtn) clearBtn.style.opacity = hasQuery ? "1" : ".55";
  }

  input.addEventListener("input", applyFilter);

  clearBtn?.addEventListener("click", () => {
    input.value = "";
    items.forEach((card) => (card.style.display = ""));
    groups.forEach(g => (g.style.display = ""));
    accs.forEach((acc, i) => (acc.open = i === 0));
    setSuggestBar("");
    input.focus();
    applyFilter();
  });

  applyFilter();
})();
