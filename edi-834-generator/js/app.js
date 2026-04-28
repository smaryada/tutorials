(function () {
  const dom = {
    list: document.getElementById("scenario-list"),
    search: document.getElementById("scenario-search"),
    title: document.getElementById("scenario-title"),
    description: document.getElementById("scenario-description"),
    meta: document.getElementById("scenario-meta"),
    form: document.getElementById("data-form"),
    dependentSection: document.getElementById("dependent-section"),
    btnGenerate: document.getElementById("btn-generate"),
    btnCopy: document.getElementById("btn-copy"),
    btnDownload: document.getElementById("btn-download"),
    btnRandomize: document.getElementById("btn-randomize"),
    btnBatch: document.getElementById("btn-batch"),
    outputRaw: document.getElementById("output-raw"),
    outputFormatted: document.getElementById("output-formatted"),
    outputExplained: document.getElementById("output-explained"),
    outputStats: document.getElementById("output-stats"),
    tabs: document.querySelectorAll(".tab"),
    toast: document.getElementById("toast")
  };

  let activeScenarioId = null;
  let lastEdiResult = null;

  /** Group scenarios by their `group` property, preserving insertion order. */
  function groupedScenarios(items) {
    const groups = {};
    const order = [];
    for (const s of items) {
      if (!groups[s.group]) {
        groups[s.group] = [];
        order.push(s.group);
      }
      groups[s.group].push(s);
    }
    return order.map(g => ({ name: g, items: groups[g] }));
  }

  /** Render the scenario sidebar. */
  function renderScenarios(filter = "") {
    const f = filter.trim().toLowerCase();
    const matching = window.SCENARIOS.filter(s =>
      !f || s.name.toLowerCase().includes(f) || s.description.toLowerCase().includes(f) || s.group.toLowerCase().includes(f)
    );
    dom.list.innerHTML = "";
    for (const grp of groupedScenarios(matching)) {
      const heading = document.createElement("div");
      heading.className = "scenario-group";
      heading.textContent = grp.name;
      dom.list.appendChild(heading);
      for (const s of grp.items) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "scenario-item" + (s.id === activeScenarioId ? " active" : "");
        btn.dataset.id = s.id;
        btn.innerHTML = `${s.name}<span class="badge">${s.ins03}/${s.ins04}</span>`;
        btn.addEventListener("click", () => selectScenario(s.id));
        dom.list.appendChild(btn);
      }
    }
  }

  /** Apply scenario-specific defaults to the form fields. */
  function applyScenarioDefaults(scenario) {
    if (!scenario.defaults) return;
    for (const [name, value] of Object.entries(scenario.defaults)) {
      const el = dom.form.elements[name];
      if (el) el.value = value;
    }
  }

  /** Show or hide the dependent fieldset based on scenario. */
  function toggleDependentSection(scenario) {
    if (scenario.includesDependent) {
      dom.dependentSection.hidden = false;
    } else {
      dom.dependentSection.hidden = true;
    }
  }

  /** Render scenario meta pills (BGN08, INS01..05, etc.). */
  function renderMeta(scenario) {
    const cells = [
      ["BGN08", scenario.bgn08],
      ["INS01", scenario.ins01],
      ["INS02", scenario.ins02],
      ["INS03", scenario.ins03],
      ["INS04", scenario.ins04],
      ["INS05", scenario.ins05],
      ["INS08", scenario.ins08]
    ];
    dom.meta.innerHTML = cells
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `<span class="meta-pill"><span class="key">${k}</span><span class="val">${v}</span></span>`)
      .join("");
  }

  /** Activate a scenario by id. */
  function selectScenario(id) {
    const scenario = window.SCENARIOS_BY_ID[id];
    if (!scenario) return;
    activeScenarioId = id;
    dom.title.textContent = scenario.name;
    dom.description.textContent = scenario.description + (scenario.notes ? " — " + scenario.notes : "");
    renderMeta(scenario);
    renderScenarios(dom.search.value);
    toggleDependentSection(scenario);
    applyScenarioDefaults(scenario);
    generate();
  }

  /** Read the form into a plain context object. */
  function readForm() {
    const data = {};
    for (const el of dom.form.elements) {
      if (!el.name) continue;
      data[el.name] = el.value;
    }
    return data;
  }

  /** Set form values from a flat object, ignoring fields that don't exist. */
  function applyFormValues(values) {
    for (const [k, v] of Object.entries(values)) {
      const el = dom.form.elements[k];
      if (el) el.value = v;
    }
  }

  /** Run the generator and update the output panels. */
  function generate() {
    if (!activeScenarioId) return;
    const scenario = window.SCENARIOS_BY_ID[activeScenarioId];
    const ctx = readForm();
    try {
      const result = window.EDI834.generate(scenario, ctx);
      lastEdiResult = result;
      dom.outputRaw.textContent = result.ediString;
      dom.outputFormatted.textContent = result.segments.map(s => s.raw.replace(/~$/, "~")).join("\n");
      dom.outputExplained.innerHTML = result.segments.map(s => `
        <div class="segment-row">
          <span class="segment-id">${s.id}</span>
          <span class="segment-content">${escapeHtml(s.content)}</span>
          <span class="segment-desc">${s.description}</span>
        </div>
      `).join("");
      const bytes = new Blob([result.ediString]).size;
      dom.outputStats.textContent = `${result.segments.length} segments · ${bytes} bytes · scenario: ${scenario.id}`;
    } catch (err) {
      console.error(err);
      dom.outputRaw.textContent = "ERROR: " + err.message;
      dom.outputFormatted.textContent = "";
      dom.outputExplained.innerHTML = "";
      dom.outputStats.textContent = "";
      showToast("Error: " + err.message, true);
    }
  }

  /** Switch tabs in the output panel. */
  function switchTab(tab) {
    dom.tabs.forEach(t => t.classList.toggle("active", t === tab));
    const target = tab.dataset.tab;
    dom.outputRaw.classList.toggle("active", target === "raw");
    dom.outputFormatted.classList.toggle("active", target === "formatted");
    dom.outputExplained.classList.toggle("active", target === "explained");
  }

  /** Copy the raw EDI to clipboard. */
  async function copyOutput() {
    if (!lastEdiResult) return;
    try {
      await navigator.clipboard.writeText(lastEdiResult.ediString);
      showToast("Copied to clipboard");
    } catch (e) {
      showToast("Copy failed: " + e.message, true);
    }
  }

  /** Trigger a download of the raw EDI. */
  function downloadOutput() {
    if (!lastEdiResult) return;
    const filename = `834_${activeScenarioId}_${Date.now()}.edi`;
    const blob = new Blob([lastEdiResult.ediString], { type: "application/edi-x12" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded " + filename);
  }

  /** Replace member/sponsor fields with new randomized data. */
  function randomize() {
    const member = SAMPLE_DATA.randomMember();
    const sponsor = SAMPLE_DATA.randomSponsor();
    const dep = SAMPLE_DATA.randomDependent(dom.form.elements.dependentRelationship.value);
    applyFormValues(Object.assign({}, member, sponsor, dep));
    generate();
    showToast("Randomized");
  }

  /** Generate every scenario at once and download as a multi-file text bundle. */
  function batchGenerate() {
    const ctx = readForm();
    const lines = [];
    lines.push("=== 834 EDI Test Data — All Scenarios ===\n");
    lines.push("Generated: " + new Date().toISOString() + "\n\n");
    for (const s of window.SCENARIOS) {
      try {
        const result = window.EDI834.generate(s, ctx);
        lines.push("---- " + s.name + " (" + s.id + ") ----");
        lines.push("Group: " + s.group + " | INS03=" + s.ins03 + " INS04=" + s.ins04);
        lines.push(result.ediString.split("~").filter(Boolean).join("~\n") + "~");
        lines.push("\n");
      } catch (err) {
        lines.push("---- " + s.name + " (FAILED: " + err.message + ") ----\n");
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `834_all_scenarios_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Generated ${window.SCENARIOS.length} scenarios`);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  let toastTimer;
  function showToast(message, isError) {
    dom.toast.textContent = message;
    dom.toast.classList.toggle("error", !!isError);
    dom.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 2200);
  }

  // ----- Wire up events -----
  dom.search.addEventListener("input", () => renderScenarios(dom.search.value));
  dom.btnGenerate.addEventListener("click", generate);
  dom.btnCopy.addEventListener("click", copyOutput);
  dom.btnDownload.addEventListener("click", downloadOutput);
  dom.btnRandomize.addEventListener("click", randomize);
  dom.btnBatch.addEventListener("click", batchGenerate);
  dom.tabs.forEach(t => t.addEventListener("click", () => switchTab(t)));
  dom.form.addEventListener("input", () => {
    // Auto-regenerate on form changes (debounced)
    clearTimeout(window.__regenTimer);
    window.__regenTimer = setTimeout(generate, 250);
  });

  // ----- Boot -----
  renderScenarios();
  selectScenario(window.SCENARIOS[0].id);
})();
