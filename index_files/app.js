(() => {
  "use strict";

  const STORAGE_KEY = "hackx-nammude-voice-cases-v1";
  const MAX_DESCRIPTION = 800;
  const departmentDefaults = {
    "Local Self Government": { sla: 7, icon: "L", reason: "Location-based civic service or local-body issue." },
    Revenue: { sla: 21, icon: "R", reason: "Land, record or revenue-office workflow." },
    "Public Works": { sla: 14, icon: "P", reason: "Public infrastructure or road maintenance issue." },
    "Health and Family Welfare": { sla: 7, icon: "H", reason: "Health-service access or facility issue." },
    "General Education": { sla: 14, icon: "E", reason: "School or higher-education service issue." },
    "Home / Police": { sla: 3, icon: "S", reason: "Safety-sensitive issue requiring prompt human review." },
    "Water Resources": { sla: 7, icon: "W", reason: "Water supply, drainage or irrigation issue." },
    Electricity: { sla: 5, icon: "⚡", reason: "Power-service interruption or public-lighting issue." },
    "Not sure": { sla: 7, icon: "?", reason: "The triage layer will identify the most likely authority." }
  };

  const categoryMap = {
    "Road or streetlight": "Local Self Government",
    "Waste or drainage": "Local Self Government",
    "Permit or certificate delay": "Local Self Government",
    "Land or revenue record": "Revenue",
    "Water or electricity": "Water Resources",
    "Health service": "Health and Family Welfare",
    "Education service": "General Education",
    "Police or safety": "Home / Police",
    Other: "Not sure"
  };

  const keywordMap = [
    { words: ["streetlight", "street light", "garbage", "waste", "drain", "pothole", "road", "permit", "panchayat", "municipality"], department: "Local Self Government" },
    { words: ["land", "patta", "survey", "revenue", "thandaper", "mutation", "possession", "village office"], department: "Revenue" },
    { words: ["pwd", "highway", "culvert", "bridge", "public works"], department: "Public Works" },
    { words: ["hospital", "doctor", "medicine", "health", "clinic", "ambulance"], department: "Health and Family Welfare" },
    { words: ["school", "teacher", "college", "student", "education", "certificate"], department: "General Education" },
    { words: ["police", "crime", "threat", "unsafe", "assault", "theft", "missing"], department: "Home / Police" },
    { words: ["water", "flood", "canal", "irrigation"], department: "Water Resources" },
    { words: ["electricity", "power cut", "transformer", "kseb", "lamp"], department: "Electricity" }
  ];

  const seedCases = [
    {
      id: "HX-260825-1042", citizenName: "Sreedevi Nair", contact: "sreedevi.demo@example.com", district: "Ernakulam", locality: "Kochi Corporation, Ward 12", department: "Local Self Government", category: "Road or streetlight", description: "The streetlight near the bus stop has been off for three weeks. Older people and students are walking in the dark after 7 pm.", urgency: "priority", evidence: "ward12-streetlight.jpg", status: "In progress", assignedTo: "Ward service desk", createdAt: "2026-08-22T09:15:00+05:30", dueAt: "2026-08-29T09:15:00+05:30", actionNote: "Electrical inspection requested from the ward team.", history: [{ at: "2026-08-22T09:15:00+05:30", label: "Case created" }, { at: "2026-08-23T11:30:00+05:30", label: "Assigned to ward service desk" }]
    },
    {
      id: "HX-260824-0881", citizenName: "Muneer K", contact: "", district: "Malappuram", locality: "Tirur Village Office", department: "Revenue", category: "Land or revenue record", description: "My land tax receipt and mutation request have been pending since the application was submitted last month.", urgency: "normal", evidence: "Application no. REV-11290", status: "New", assignedTo: "Revenue nodal desk", createdAt: "2026-08-24T15:00:00+05:30", dueAt: "2026-09-14T15:00:00+05:30", actionNote: "", history: [{ at: "2026-08-24T15:00:00+05:30", label: "Case created" }]
    },
    {
      id: "HX-260820-0714", citizenName: "Asha Thomas", contact: "asha.demo@example.com", district: "Kottayam", locality: "Kottayam Municipality, Ward 4", department: "Local Self Government", category: "Waste or drainage", description: "Open waste has accumulated beside the public drain near the market. The smell is affecting nearby homes and shops.", urgency: "urgent", evidence: "market-drain-video.mp4", status: "In progress", assignedTo: "Sanitation response team", createdAt: "2026-08-20T10:20:00+05:30", dueAt: "2026-08-23T10:20:00+05:30", actionNote: "Site visit completed; removal crew scheduled.", history: [{ at: "2026-08-20T10:20:00+05:30", label: "Case created" }, { at: "2026-08-21T09:00:00+05:30", label: "Site visit completed" }]
    },
    {
      id: "HX-260817-0522", citizenName: "Ravi P", contact: "", district: "Thrissur", locality: "Government Higher Secondary School", department: "General Education", category: "Education service", description: "The disability certificate support desk has not replied to the student application even after two reminders.", urgency: "priority", evidence: "Student application EDU-8031", status: "Resolved", assignedTo: "School nodal officer", createdAt: "2026-08-17T12:00:00+05:30", dueAt: "2026-08-31T12:00:00+05:30", actionNote: "The school confirmed the application was forwarded and the family received an update.", resolutionNote: "Citizen was contacted and the pending application was forwarded to the district desk.", history: [{ at: "2026-08-17T12:00:00+05:30", label: "Case created" }, { at: "2026-08-19T14:40:00+05:30", label: "Resolved after school confirmation" }]
    }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const now = () => new Date();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeLoad() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : clone(seedCases);
    } catch (error) {
      return clone(seedCases);
    }
  }

  let cases = safeLoad();
  let lastFocusedElement = null;

  function persist() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); } catch (error) { showToast("Browser storage is unavailable; use Export data to keep a copy."); }
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
  }

  function formatDate(value, includeTime = false) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(date);
  }

  function addDays(dateValue, days) {
    const date = new Date(dateValue);
    date.setDate(date.getDate() + Number(days));
    return date.toISOString();
  }

  function daysUntil(value) {
    return Math.ceil((new Date(value).getTime() - now().getTime()) / 86400000);
  }

  function getSlaState(item) {
    if (item.status === "Resolved" || item.status === "Rejected") return { label: item.status, className: "resolved", days: null };
    const days = daysUntil(item.dueAt);
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: "overdue", days };
    if (days <= 2) return { label: `${days}d left`, className: "risk", days };
    return { label: `${days}d left`, className: "on-track", days };
  }

  function getPriority(item) {
    if (item.urgency === "urgent") return { label: "Urgent", className: "urgent" };
    if (item.urgency === "priority") return { label: "Priority", className: "priority" };
    return { label: "Normal", className: "normal" };
  }

  function inferDepartment(formValues) {
    const selected = formValues.department;
    if (selected && selected !== "Not sure") return selected;
    const text = `${formValues.category} ${formValues.description}`.toLowerCase();
    const match = keywordMap.find((entry) => entry.words.some((word) => text.includes(word)));
    return match ? match.department : (categoryMap[formValues.category] || "Not sure");
  }

  function analyse(values) {
    const department = inferDepartment(values);
    const config = departmentDefaults[department] || departmentDefaults["Not sure"];
    const text = `${values.description || ""} ${values.category || ""}`.toLowerCase();
    let urgency = values.urgency || "normal";
    if (/(danger|unsafe|fire|accident|threat|flooded|immediate)/.test(text)) urgency = "urgent";
    const completeness = [values.district, values.locality, values.category, values.description && values.description.length >= 20, values.evidence].filter(Boolean).length;
    const confidence = Math.min(98, Math.max(61, 66 + (department !== "Not sure" ? 17 : 0) + (values.category ? 7 : 0) + (values.locality ? 5 : 0) + (values.evidence ? 3 : 0)));
    const priority = urgency === "urgent" ? { label: "Urgent", className: "urgent" } : urgency === "priority" ? { label: "Priority", className: "priority" } : { label: "Normal", className: "normal" };
    return { department, config, urgency, confidence, completeness, priority };
  }

  function updateTriage() {
    const form = $("#complaint-form");
    const values = Object.fromEntries(new FormData(form).entries());
    values.description = values.description || "";
    const hasText = values.description.length > 0 || values.category || values.department || values.locality;
    $("#triage-empty").hidden = Boolean(hasText);
    $("#triage-result").hidden = !hasText;
    if (!hasText) return;
    const result = analyse(values);
    $("#triage-route-icon").textContent = result.config.icon;
    $("#triage-department").textContent = result.department;
    $("#triage-reason").textContent = result.config.reason;
    $("#triage-priority").textContent = result.priority.label;
    $("#triage-sla").textContent = `${result.config.sla} days`;
    $("#triage-confidence").textContent = `${result.confidence}%`;
    $("#triage-confidence-bar").style.width = `${result.confidence}%`;
    const readiness = [
      { label: "Location identified", ok: Boolean(values.district && values.locality) },
      { label: "Issue category selected", ok: Boolean(values.category) },
      { label: "Problem description is usable", ok: values.description.length >= 20 },
      { label: "Evidence reference attached", ok: Boolean(values.evidence) }
    ];
    $("#readiness-list").innerHTML = readiness.map((item) => `<li class="${item.ok ? "" : "missing"}">${escapeHtml(item.ok ? item.label : `${item.label} — recommended`)}</li>`).join("");
  }

  function renderStats() {
    const active = cases.filter((item) => !["Resolved", "Rejected"].includes(item.status)).length;
    const urgent = cases.filter((item) => ["urgent", "priority"].includes(item.urgency) && !["Resolved", "Rejected"].includes(item.status)).length;
    const atRisk = cases.filter((item) => ["risk", "overdue"].includes(getSlaState(item).className)).length;
    const resolved = cases.filter((item) => item.status === "Resolved").length;
    $("#nav-active-count").textContent = active;
    $("#stats-grid").innerHTML = [
      ["Active cases", active, "Needs an officer action", "blue"],
      ["SLA at risk", atRisk, "Due within 48 hours or overdue", "red"],
      ["Priority queue", urgent, "Urgent and priority cases", "amber"],
      ["Resolved", resolved, "Citizen-facing outcome recorded", "teal"]
    ].map(([label, value, detail, tone]) => `<article class="stat-card ${tone}"><span class="label-muted">${label}</span><strong>${value}</strong><p>${detail}</p></article>`).join("");
  }

  function caseMatches(item, filter, query) {
    const text = `${item.id} ${item.citizenName} ${item.locality} ${item.district} ${item.category} ${item.department} ${item.description}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    const sla = getSlaState(item).className;
    if (filter === "active") return !["Resolved", "Rejected"].includes(item.status);
    if (filter === "priority") return ["urgent", "priority"].includes(item.urgency);
    if (filter === "sla") return ["risk", "overdue"].includes(sla);
    if (filter === "resolved") return item.status === "Resolved";
    return true;
  }

  function renderQueue() {
    const filter = $("#case-filter").value;
    const query = $("#case-search").value.trim();
    const visible = cases.filter((item) => caseMatches(item, filter, query)).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    const list = $("#case-list");
    if (!visible.length) { list.innerHTML = `<div class="empty-queue"><h3>No matching cases</h3><p>Try another filter or restore the demo cases.</p></div>`; return; }
    list.innerHTML = visible.map((item) => {
      const priority = getPriority(item); const sla = getSlaState(item); const firstLine = item.description.length > 90 ? `${item.description.slice(0, 90)}…` : item.description;
      const slaClass = sla.className === "risk" || sla.className === "overdue" ? "rejected" : sla.className === "resolved" ? "resolved" : "progress";
      return `<article class="case-row" data-case-id="${escapeHtml(item.id)}">
        <div><span class="case-id">${escapeHtml(item.id)}</span><strong>${escapeHtml(item.locality)}</strong><p>${escapeHtml(item.district)}</p></div>
        <div><span class="priority-badge ${priority.className}">${priority.label}</span><strong>${escapeHtml(item.category)}</strong><p>${escapeHtml(firstLine)}</p></div>
        <div><span class="label-muted">Owner</span><strong>${escapeHtml(item.department)}</strong><p>${escapeHtml(item.assignedTo || "Unassigned")}</p></div>
        <div><span class="label-muted">SLA</span><span class="status-badge ${slaClass}">${escapeHtml(sla.label)}</span><p>Due ${formatDate(item.dueAt)}</p></div>
        <button class="button button-secondary" type="button" data-open-case="${escapeHtml(item.id)}">Review</button>
      </article>`;
    }).join("");
    $$('[data-open-case]', list).forEach((button) => button.addEventListener("click", () => openCase(button.dataset.openCase)));
  }

  function renderInsights() {
    const departmentCounts = {};
    cases.forEach((item) => { departmentCounts[item.department] = (departmentCounts[item.department] || 0) + 1; });
    const departments = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, departments[0]?.[1] || 1);
    $("#department-chart").innerHTML = departments.length ? departments.slice(0, 7).map(([name, count]) => `<div class="bar-item"><span>${escapeHtml(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(count / max * 100)}%"></div></div><span class="bar-number">${count}</span></div>`).join("") : `<p>No data yet.</p>`;
    const counts = { New: 0, "In progress": 0, Resolved: 0 };
    cases.forEach((item) => { if (counts[item.status] !== undefined) counts[item.status] += 1; });
    $("#outcome-chart").innerHTML = [["New", counts.New], ["In progress", counts["In progress"]], ["Resolved", counts.Resolved]].map(([label, count]) => `<div class="outcome-item"><strong>${count}</strong><span>${label}</span></div>`).join("");
    const rootCauses = [
      ["Routing uncertainty", cases.filter((item) => item.department === "Not sure").length, "Improve department selection and authority mapping."],
      ["Missing evidence", cases.filter((item) => !item.evidence).length, "Prompt for application numbers, photos or location proof."],
      ["SLA pressure", cases.filter((item) => ["risk", "overdue"].includes(getSlaState(item).className)).length, "Escalate ageing cases before the deadline."],
      ["Cross-office handoff", cases.filter((item) => item.actionNote && /forward|handoff|refer/i.test(item.actionNote)).length, "Keep one accountable case owner across offices."],
      ["Citizen follow-up", cases.filter((item) => item.status === "Resolved" && item.resolutionNote).length, "Record the evidence behind every closure."],
      ["Language access", 0, "Add Malayalam voice and assisted call-centre support in the next pilot."]
    ];
    $("#root-cause-list").innerHTML = rootCauses.map(([label, count, detail]) => `<div class="root-cause"><strong>${escapeHtml(label)} <span class="nav-count">${count}</span></strong><p>${escapeHtml(detail)}</p></div>`).join("");
    $("#insight-date").textContent = `Updated ${formatDate(now().toISOString(), true)}`;
  }

  function renderAll() { renderStats(); renderQueue(); renderInsights(); }

  function showToast(message) {
    const toast = $("#toast"); toast.textContent = message; toast.hidden = false;
    window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3800);
  }

  function showView(name) {
    $$(".nav-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === name));
    $$(".view").forEach((view) => { const active = view.id === `view-${name}`; view.classList.toggle("is-visible", active); view.hidden = !active; });
    if (name === "officer" || name === "insights") renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeCase() {
    const returnTarget = lastFocusedElement;
    lastFocusedElement = null;
    $("#case-detail").hidden = true;
    $("#case-detail").innerHTML = "";
    $("#drawer-backdrop")?.remove();
    if (returnTarget && typeof returnTarget.focus === "function") returnTarget.focus({ preventScroll: true });
  }

  function openCase(id) {
    const item = cases.find((entry) => entry.id === id); if (!item) return;
    lastFocusedElement = document.activeElement;
    const detail = $("#case-detail"); const priority = getPriority(item); const sla = getSlaState(item);
    detail.innerHTML = `<div class="drawer-head"><div><span class="case-id">${escapeHtml(item.id)}</span><h2 id="drawer-title">${escapeHtml(item.category)}</h2><p>${escapeHtml(item.locality)}, ${escapeHtml(item.district)}</p></div><button class="drawer-close" id="close-drawer" type="button" aria-label="Close case review">Close</button></div>
      <div class="detail-block"><div class="detail-grid"><div><span class="label-muted">Owner</span><p>${escapeHtml(item.department)}</p></div><div><span class="label-muted">Priority</span><p><span class="priority-badge ${priority.className}">${priority.label}</span></p></div><div><span class="label-muted">SLA status</span><p>${escapeHtml(sla.label)}</p></div><div><span class="label-muted">Due date</span><p>${formatDate(item.dueAt)}</p></div></div></div>
      <div class="detail-block"><h3>Citizen description</h3><p>${escapeHtml(item.description)}</p><p class="helper-text">Evidence: ${escapeHtml(item.evidence || "Not supplied")}</p></div>
      <div class="detail-block"><h3>Case timeline</h3>${(item.history || []).map((event) => `<p><strong>${formatDate(event.at, true)}</strong> — ${escapeHtml(event.label)}</p>`).join("")}</div>
      <form class="detail-form" id="detail-form"><label for="detail-status">Update status</label><select id="detail-status"><option ${item.status === "New" ? "selected" : ""}>New</option><option ${item.status === "In progress" ? "selected" : ""}>In progress</option><option ${item.status === "Resolved" ? "selected" : ""}>Resolved</option><option ${item.status === "Rejected" ? "selected" : ""}>Rejected</option></select><label for="detail-assignee">Assigned owner</label><input id="detail-assignee" value="${escapeHtml(item.assignedTo || "")}" placeholder="Officer or service desk" /><label for="detail-action">Action taken / next action</label><textarea id="detail-action" placeholder="Record a concrete action, handoff or request for evidence">${escapeHtml(item.actionNote || "")}</textarea><label for="detail-resolution">Resolution evidence <span class="optional">Required for resolved cases</span></label><textarea id="detail-resolution" placeholder="What changed, who confirmed it and when?">${escapeHtml(item.resolutionNote || "")}</textarea><p class="form-error" id="detail-error" role="alert" hidden></p><div class="drawer-actions"><button class="button button-primary" type="submit">Save case update</button><button class="button button-quiet" id="cancel-drawer" type="button">Cancel</button></div></form>`;
    detail.hidden = false;
    const backdrop = document.createElement("div"); backdrop.id = "drawer-backdrop"; backdrop.className = "drawer-backdrop"; backdrop.addEventListener("click", closeCase); document.body.appendChild(backdrop);
    detail.setAttribute("aria-labelledby", "drawer-title"); detail.focus({ preventScroll: true });
    $("#close-drawer").addEventListener("click", closeCase); $("#cancel-drawer").addEventListener("click", closeCase);
    $("#detail-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const status = $("#detail-status").value; const resolutionNote = $("#detail-resolution").value.trim(); const error = $("#detail-error");
      if (status === "Resolved" && resolutionNote.length < 12) { error.textContent = "Add a short resolution evidence note before marking this case resolved."; error.hidden = false; return; }
      item.status = status; item.assignedTo = $("#detail-assignee").value.trim() || "Unassigned"; item.actionNote = $("#detail-action").value.trim(); item.resolutionNote = resolutionNote;
      item.history = item.history || []; item.history.push({ at: now().toISOString(), label: status === "Resolved" ? "Marked resolved with evidence" : `Status updated to ${status}` });
      persist(); closeCase(); renderAll(); showToast(`${item.id} updated and stored locally.`);
    });
  }

  function submitComplaint(event) {
    event.preventDefault();
    const form = event.currentTarget; const values = Object.fromEntries(new FormData(form).entries()); const error = $("#form-error");
    if (!form.checkValidity()) { error.textContent = "Please complete the required fields. The description should contain at least 20 characters."; error.hidden = false; form.reportValidity(); return; }
    if (!values.consent) { error.textContent = "Please confirm the local-demo storage notice."; error.hidden = false; return; }
    error.hidden = true;
    const triage = analyse(values); const created = now(); const id = `HX-${String(created.getFullYear()).slice(-2)}${String(created.getMonth() + 1).padStart(2, "0")}${String(created.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const item = { id, citizenName: values.citizenName || "Anonymous citizen", contact: values.contact || "", district: values.district, locality: values.locality, department: triage.department, category: values.category, description: values.description.slice(0, MAX_DESCRIPTION), urgency: triage.urgency, evidence: values.evidence || "", status: "New", assignedTo: "Triage queue", createdAt: created.toISOString(), dueAt: addDays(created, triage.config.sla), actionNote: "Awaiting officer review.", history: [{ at: created.toISOString(), label: "Case created by citizen intake" }] };
    cases.unshift(item); persist(); renderAll(); form.reset(); $("#char-count").textContent = "0 / 800"; updateTriage(); showToast(`${id} saved. It is ready for authorised review.`); showView("officer"); openCase(id);
  }

  function exportData() {
    const payload = { product: "Hack X / Nammude Voice", exportedAt: now().toISOString(), storage: "browser-local-demo", cases };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `hack-x-civic-cases-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); showToast("JSON export downloaded.");
  }

  function restoreDemo() { cases = clone(seedCases); persist(); renderAll(); showToast("Demo cases restored."); }

  $$(".nav-tab").forEach((tab) => tab.addEventListener("click", () => showView(tab.dataset.view)));
  $("#complaint-form").addEventListener("submit", submitComplaint);
  ["input", "change"].forEach((eventName) => $("#complaint-form").addEventListener(eventName, updateTriage));
  $("#description").addEventListener("input", (event) => { if (event.target.value.length > MAX_DESCRIPTION) event.target.value = event.target.value.slice(0, MAX_DESCRIPTION); $("#char-count").textContent = `${event.target.value.length} / ${MAX_DESCRIPTION}`; });
  $("#case-search").addEventListener("input", renderQueue); $("#case-filter").addEventListener("change", renderQueue);
  $("#export-top").addEventListener("click", exportData); $("#export-officer").addEventListener("click", exportData); $("#seed-demo").addEventListener("click", restoreDemo);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !$("#case-detail").hidden) closeCase(); });

  renderAll(); updateTriage();
})();
