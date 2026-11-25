// Search and filters for the directory pages (research groups, people, news).
// Works on any element marked data-directory. Items inside it carry data-text
// plus one data-* value per filter, for example data-department.
document.querySelectorAll("[data-directory]").forEach((root) => {
  const items = [...root.querySelectorAll("[data-item]")];
  const search = root.querySelector("[data-search]");
  const selects = [...root.querySelectorAll("select[data-filter]")];
  const chips = [...root.querySelectorAll("button[data-filter]")];
  const count = root.querySelector("[data-count]");
  const empty = root.querySelector("[data-empty]");
  const chosen = {};

  const apply = () => {
    const q = search ? search.value.trim().toLowerCase() : "";
    let shown = 0;
    for (const item of items) {
      const matchesText = !q || item.dataset.text.toLowerCase().includes(q);
      const matchesFilters = Object.entries(chosen).every(([key, value]) => value === "All" || item.dataset[key] === value);
      item.hidden = !(matchesText && matchesFilters);
      if (!item.hidden) shown += 1;
    }
    if (count) count.textContent = count.dataset.count.replace("%n", shown).replace("%s", shown === 1 ? count.dataset.one : count.dataset.many);
    if (empty) empty.hidden = shown > 0;
  };

  const choose = (key, value) => {
    chosen[key] = value;
    for (const chip of chips) if (chip.dataset.filter === key) chip.setAttribute("aria-pressed", String(chip.value === value));
    for (const select of selects) if (select.dataset.filter === key) select.value = value;
    apply();
  };

  if (search) search.addEventListener("input", apply);
  for (const select of selects) select.addEventListener("change", () => choose(select.dataset.filter, select.value));
  for (const chip of chips) chip.addEventListener("click", () => choose(chip.dataset.filter, chip.value));

  // A link such as /groups/?department=Mathematics opens the page already filtered.
  const params = new URLSearchParams(location.search);
  for (const [key, value] of params) {
    const known = [...chips, ...selects.flatMap((s) => [...s.options])].some((c) => (c.dataset.filter || c.parentElement.dataset.filter) === key && c.value === value);
    if (known) choose(key, value);
  }
  apply();
});
