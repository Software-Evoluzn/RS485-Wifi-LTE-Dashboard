/* ─────────────────────────────────────────────
   Evoluzn Dashboard — app.js
───────────────────────────────────────────── */

function generate24hrLabels() {
  const labels = [];
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m++)
      labels.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  return labels;
}

function emptyData() { return new Array(1440).fill(null); }

const LABELS = generate24hrLabels();

const LINE_CONFIGS = [
  { label: "RS485_1", color: "#E53935", data: emptyData() },
  { label: "RS485_2", color: "#FFB300", data: emptyData() },
  { label: "RS232_1", color: "#1E88E5", data: emptyData() },
  { label: "RS232_2", color: "#212121", data: emptyData() },
];

const datasets = LINE_CONFIGS.map((cfg) => ({
  label: cfg.label,
  data: cfg.data,
  borderColor: cfg.color,
  backgroundColor: cfg.color,
  borderWidth: 1.5,
  pointRadius: 3,
  pointHoverRadius: 6,
  pointBackgroundColor: cfg.color,
  tension: 0,
  fill: false,
  spanGaps: false,
}));

const ctx = document.getElementById("tempChart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: { labels: LABELS, datasets },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "center",
        onClick: () => {},
        labels: {
          usePointStyle: false,
          boxWidth: window.innerWidth < 576 ? 12 : 18,
          boxHeight: window.innerWidth < 576 ? 8 : 10,
          padding: window.innerWidth < 576 ? 8 : 18,
          font: { size: window.innerWidth < 576 ? 10 : 12, weight: "500" },
        },
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "#1A1A2E",
        bodyColor: "#607080",
        borderColor: "#DDE3EA",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        filter: (item) => item.raw !== null,
      },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
        pan: { enabled: true, mode: "x" },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Time", color: "#607080", font: { size: 11 } },
        ticks: { maxTicksLimit: 60, maxRotation: 45, minRotation: 30, autoSkip: true, font: { size: 10 }, color: "#607080" },
        grid: { color: "#EDF0F3" },
      },
      y: {
        title: { display: true, text: "Sensor Reading", color: "#607080", font: { size: 11 } },
        ticks: { color: "#607080", font: { size: 11 } },
        grid: { color: "#EDF0F3" },
      },
    },
  },
});

document.getElementById("tempChart").addEventListener("dblclick", () => chart.resetZoom());

// ── timestamp "YYYY-MM-DD HH:MM:SS" → LABELS index (0–1439) ──────────────
function tsToIndex(ts) {
  if (!ts || ts.length < 16) return -1;
  const h = parseInt(ts.slice(11, 13), 10);
  const m = parseInt(ts.slice(14, 16), 10);
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
}

// ── Wipe chart and refill from DB for the given date ─────────────────────
let currentViewDate = new Date().toISOString().slice(0, 10);

function loadDateFromServer(dateStr, resetZoom = true) {
  currentViewDate = dateStr;

  LINE_CONFIGS.forEach((cfg) => { cfg.data = emptyData(); });
  chart.data.datasets.forEach((ds, i) => { ds.data = LINE_CONFIGS[i].data; });
  chart.data.labels = LABELS;
  if (resetZoom) chart.resetZoom();

  // ── CHANGE 1: pass SELECTED_DEVICE to filter graph data ──
  fetch(`/graph_data?start_date=${dateStr}&end_date=${dateStr}&device=${SELECTED_DEVICE}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      data.labels.forEach((ts, i) => {
        const idx = tsToIndex(ts);
        if (idx === -1) return;
        LINE_CONFIGS[0].data[idx] = data.RS485_1[i];
        LINE_CONFIGS[1].data[idx] = data.RS485_2[i];
        LINE_CONFIGS[2].data[idx] = data.RS232_1[i];
        LINE_CONFIGS[3].data[idx] = data.RS232_2[i];
      });
      chart.data.datasets.forEach((ds, i) => { ds.data = LINE_CONFIGS[i].data; });
      chart.update("none");

      if (data.labels.length > 0) {
        const last = data.labels.length - 1;
        document.getElementById("rs485_1_value").textContent = data.RS485_1[last] ?? "--";
        document.getElementById("rs485_2_value").textContent = data.RS485_2[last] ?? "--";
        document.getElementById("rs232_1_value").textContent = data.RS232_1[last] ?? "--";
        document.getElementById("rs232_2_value").textContent = data.RS232_2[last] ?? "--";

        const d = new Date((data.labels[last] || "").replace(" ", "T"));
        if (!isNaN(d)) {
          const hhmm      = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
          const ddMonYyyy = d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
          document.getElementById("live_timestamp").textContent = `${hhmm}  |  ${ddMonYyyy}`;
        }
      }
    })
    .catch((err) => console.error("❌ graph_data fetch failed:", err));
}

// ── Download Dropdown ──────────────────────────────────────────────────────
const downloadDropdown = document.getElementById("downloadDropdown");

document.getElementById("btnDownload").addEventListener("click", (e) => {
  e.stopPropagation();
  setDateDropdown.classList.add("d-none");
  filterDropdown.classList.add("d-none");
  downloadDropdown.classList.toggle("d-none");
});

document.getElementById("btnDownloadToday").addEventListener("click", () => {
  const today = new Date().toISOString().slice(0, 10);
  window.location.href = `/download?start=${today}&end=${today}`;
  downloadDropdown.classList.add("d-none");
});

document.getElementById("btnDownloadByDate").addEventListener("click", () => {
  const start = document.getElementById("dlStartDate").value;
  const end   = document.getElementById("dlEndDate").value;
  if (!start || !end) { showToast("Please select both start and end date.", "warning"); return; }
  window.location.href = `/download?start=${start}&end=${end}`;
  downloadDropdown.classList.add("d-none");
});

// ── Set Date Dropdown ──────────────────────────────────────────────────────
const setDateDropdown = document.getElementById("setDateDropdown");

const fp = flatpickr("#datePicker", {
  mode: "single",
  dateFormat: "Y-m-d",
  defaultDate: "today",
  disableMobile: false,
  static: true,
  onReady(_, __, instance) {
    const parent = document.getElementById("btnSetDate").parentElement;
    parent.appendChild(instance.calendarContainer);
    const cal = instance.calendarContainer;
    cal.style.position  = "absolute";
    cal.style.top       = "calc(100% + 6px)";
    cal.style.right     = "0";
    cal.style.left      = "auto";
    cal.style.zIndex    = "9999";
  },
  onClose(selectedDates) {
    if (selectedDates.length === 1) {
      const d = selectedDates[0];
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const fmt = (dt) => dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      document.getElementById("btnSetDate").innerHTML =
        `<i class="bi bi-calendar3 me-1"></i><span class="d-none d-sm-inline">${fmt(d)}</span>`;
      loadDateFromServer(dateStr);
    }
  },
});

document.getElementById("btnSetDate").innerHTML =
  `<i class="bi bi-calendar3 me-1"></i><span class="d-none d-sm-inline">Today</span>`;

document.getElementById("btnSetDate").addEventListener("click", (e) => {
  e.stopPropagation();
  downloadDropdown.classList.add("d-none");
  filterDropdown.classList.add("d-none");
  setDateDropdown.classList.toggle("d-none");
});

document.getElementById("btnFilterToday").addEventListener("click", () => {
  const today = new Date().toISOString().slice(0, 10);
  setDateDropdown.classList.add("d-none");
  document.getElementById("btnSetDate").innerHTML =
    `<i class="bi bi-calendar3 me-1"></i><span class="d-none d-sm-inline">Today</span>`;
  loadDateFromServer(today);
});

document.getElementById("btnFilterPickDate").addEventListener("click", (e) => {
  e.stopPropagation();
  setDateDropdown.classList.add("d-none");
  fp.open();
});

document.getElementById("clearDate").addEventListener("click", () => {
  fp.clear();
  document.getElementById("btnSetDate").innerHTML =
    `<i class="bi bi-calendar3 me-1"></i><span class="d-none d-sm-inline">Set Date</span>`;
  LINE_CONFIGS.forEach((cfg) => { cfg.data = emptyData(); });
  chart.data.datasets.forEach((ds, i) => { ds.data = LINE_CONFIGS[i].data; });
  chart.resetZoom();
  chart.update();
});

// ── Filter Dropdown ────────────────────────────────────────────────────────
const filterDropdown = document.getElementById("filterDropdown");

document.getElementById("btnFilter").addEventListener("click", (e) => {
  e.stopPropagation();
  downloadDropdown.classList.add("d-none");
  setDateDropdown.classList.add("d-none");
  filterDropdown.classList.toggle("d-none");
});

document.addEventListener("click", (e) => {
  if (!filterDropdown.contains(e.target))    filterDropdown.classList.add("d-none");
  if (!downloadDropdown.contains(e.target))  downloadDropdown.classList.add("d-none");
  if (!setDateDropdown.contains(e.target))   setDateDropdown.classList.add("d-none");
});

document.querySelectorAll(".evl-filter-opt").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    document.querySelectorAll(".evl-filter-opt").forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    const line = parseInt(this.dataset.line, 10);
    const label = this.textContent.trim();
    chart.data.datasets.forEach((_, i) => {
      chart.getDatasetMeta(i).hidden = line === -1 ? false : i !== line;
    });
    chart.update();
    filterDropdown.classList.add("d-none");
    document.getElementById("btnFilter").innerHTML =
      `<i class="bi bi-funnel me-1"></i><span class="d-none d-sm-inline">${label}</span>`;
  });
});

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(message, type = "info") {
  const old = document.getElementById("evl-toast");
  if (old) old.remove();
  const iconMap  = { info: "bi-info-circle", success: "bi-check-circle", warning: "bi-exclamation-triangle" };
  const colorMap = { info: "#1565C0", success: "#2E7D32", warning: "#E65100" };
  const toast = document.createElement("div");
  toast.id = "evl-toast";
  toast.innerHTML = `
    <div style="position:fixed;bottom:24px;right:24px;z-index:9999;background:#fff;border:1px solid #DDE3EA;
      border-radius:10px;padding:0.75rem 1.1rem;display:flex;align-items:center;gap:0.6rem;
      box-shadow:0 8px 24px rgba(0,0,0,.12);font-size:0.87rem;font-weight:500;color:#1A1A2E;
      max-width:280px;animation:slideUp .25s ease;">
      <i class="bi ${iconMap[type]}" style="color:${colorMap[type]};font-size:1rem;"></i>${message}
    </div>
    <style>@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}</style>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Socket.IO ─────────────────────────────────────────────────────────────
const socket = io();

socket.on("connect", () => {
  console.log("✅ Connected to server");
  loadDateFromServer(currentViewDate);
});

// ── CHANGE 2: ignore socket updates from the other device ──
socket.on("sensor_update", (data) => {
  if (data.device_id && SELECTED_DEVICE && data.device_id !== SELECTED_DEVICE) return;

  console.log("📡 Sensor Update:", data);

  document.getElementById("rs485_1_value").textContent = data.RS485_1;
  document.getElementById("rs485_2_value").textContent = data.RS485_2;
  document.getElementById("rs232_1_value").textContent = data.RS232_1;
  document.getElementById("rs232_2_value").textContent = data.RS232_2;

  if (data.device_timestamp) {
    const d = new Date(data.device_timestamp.replace(" ", "T"));
    if (!isNaN(d)) {
      const hhmm      = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
      const ddMonYyyy = d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
      document.getElementById("live_timestamp").textContent = `${hhmm}  |  ${ddMonYyyy}`;
    }
  }

  loadDateFromServer(currentViewDate, false);
});

// ── CHANGE 3: pass SELECTED_DEVICE to filter latest card data ──
function loadLatestFromDB() {
  fetch(`/latest?device=${SELECTED_DEVICE}`)
    .then((res) => {
      if (res.status === 204) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (!data || !data.device_timestamp) return;

      document.getElementById("rs485_1_value").textContent = data.RS485_1;
      document.getElementById("rs485_2_value").textContent = data.RS485_2;
      document.getElementById("rs232_1_value").textContent = data.RS232_1;
      document.getElementById("rs232_2_value").textContent = data.RS232_2;

      const d = new Date(data.device_timestamp.replace(" ", "T"));
      if (!isNaN(d)) {
        const hhmm      = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
        const ddMonYyyy = d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
        document.getElementById("live_timestamp").textContent = `${hhmm}  |  ${ddMonYyyy}`;
      }
    })
    .catch((err) => console.error("❌ /latest fetch failed:", err));
}

loadLatestFromDB();