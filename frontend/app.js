// RepairLensAI — app.js

// ── Dataset Constants & Mappings ──────────────────────────
const BRANDS_LIST = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Kia',
  'Renault', 'Nissan', 'Skoda', 'Volkswagen', 'MG', 'Jeep', 'Citroen', 'BYD',
  'Isuzu', 'Force', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Lexus', 'Jaguar',
  'Land Rover', 'Porsche'
];

const BRAND_MODELS_MAP = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Brezza', 'Ertiga', 'Dzire', 'Wagon R', 'Alto K10', 'Fronx', 'Grand Vitara', 'Jimny', 'S-Presso', 'Celerio', 'XL6', 'Invicto', 'Ciaz', 'Ignis', 'Eeco'],
  'Hyundai': ['Creta', 'i20', 'Venue', 'Verna', 'Exter', 'Aura', 'Grand i10 Nios', 'Alcazar', 'Tucson', 'IONIQ 5', 'Kona Electric'],
  'Tata': ['Nexon', 'Punch', 'Harrier', 'Safari', 'Altroz', 'Tiago', 'Tigor', 'Curvv', 'Nexon EV', 'Punch EV', 'Tiago EV'],
  'Mahindra': ['Thar', 'Scorpio N', 'XUV700', 'XUV 3XO', 'Scorpio Classic', 'Bolero', 'Thar Roxx', 'XUV400', 'Marazzo'],
  'Toyota': ['Fortuner', 'Innova Crysta', 'Innova Hycross', 'Glanza', 'Urban Cruiser Hyryder', 'Camry', 'Hilux', 'Vellfire', 'Land Cruiser 300'],
  'Honda': ['City', 'Amaze', 'Elevate', 'City e:HEV', 'WR-V', 'Jazz', 'Civic'],
  'Kia': ['Seltos', 'Sonet', 'Carens', 'Carnival', 'EV6', 'EV9'],
  'Renault': ['Kwid', 'Triber', 'Kiger', 'Duster'],
  'Nissan': ['Magnite', 'X-Trail', 'Kicks'],
  'Skoda': ['Kushaq', 'Slavia', 'Kodiaq', 'Superb', 'Octavia'],
  'Volkswagen': ['Taigun', 'Virtus', 'Tiguan', 'Polo', 'Vento'],
  'MG': ['Hector', 'Astor', 'ZS EV', 'Comet EV', 'Windsor EV', 'Gloster'],
  'Jeep': ['Compass', 'Meridian', 'Wrangler', 'Grand Cherokee'],
  'Citroen': ['C3', 'eC3', 'C3 Aircross', 'C5 Aircross', 'Basalt'],
  'BYD': ['Atto 3', 'e6', 'Seal', 'Sealion 7'],
  'Isuzu': ['D-Max', 'V-Cross', 'MU-X'],
  'Force': ['Gurkha', 'Gurkha 5-Door', 'Urbania'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'i4', 'i7', 'iX'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'G-Class', 'EQS'],
  'Audi': ['A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  'Volvo': ['XC40', 'XC60', 'XC90', 'C40', 'EX30'],
  'Lexus': ['ES', 'NX', 'RX', 'LX', 'LM'],
  'Jaguar': ['XE', 'XF', 'F-Pace', 'F-Type', 'I-Pace'],
  'Land Rover': ['Range Rover', 'Range Rover Sport', 'Defender', 'Discovery', 'Evoque', 'Velar'],
  'Porsche': ['911', 'Cayenne', 'Macan', 'Taycan', 'Panamera', '718 Cayman']
};

// Populate Dropdowns on Page Load
document.addEventListener("DOMContentLoaded", () => {
  const brandSelect = document.getElementById("car-brand");
  const modelSelect = document.getElementById("car-model");
  const yearSelect = document.getElementById("car-year");

  if (brandSelect && modelSelect && yearSelect) {
    // Populate Brands
    brandSelect.innerHTML = BRANDS_LIST.map(b => `<option value="${b}">${b}</option>`).join("");

    // Populate Models for default brand
    const updateModels = (brand) => {
      const models = BRAND_MODELS_MAP[brand] || BRAND_MODELS_MAP['Maruti Suzuki'];
      modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join("");
    };

    updateModels(BRANDS_LIST[0]);

    brandSelect.addEventListener("change", (e) => {
      updateModels(e.target.value);
    });

    // Populate Years (2010 to 2026)
    const years = [];
    for (let y = 2026; y >= 2010; y--) {
      years.push(`<option value="${y}" ${y === 2020 ? 'selected' : ''}>${y}</option>`);
    }
    yearSelect.innerHTML = years.join("");
  }
});

// ── Navbar scroll effect ──────────────────────────────────
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
});

// ── Active nav link on scroll ─────────────────────────────
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove("active"));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add("active");
      }
    });
  },
  { threshold: 0.4 }
);
sections.forEach((s) => observer.observe(s));

// ── Hamburger menu ────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const navLinksEl = document.getElementById("nav-links");

if (hamburger && navLinksEl) {
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburger.classList.toggle("active");
    navLinksEl.classList.toggle("active");
  });

  // Close menu when tapping any link
  document.querySelectorAll(".nav-link, #nav-cta").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navLinksEl.classList.remove("active");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navLinksEl.contains(e.target) && !hamburger.contains(e.target)) {
      hamburger.classList.remove("active");
      navLinksEl.classList.remove("active");
    }
  });
}


// ── Animate stat counters ─────────────────────────────────
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || "";
  const decimals = target % 1 !== 0 ? 1 : 0;
  const duration = 1600;
  const start = performance.now();

  function update(now) {
    const elapsed = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (elapsed < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(".stat-value").forEach(animateCounter);
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

const statsRow = document.getElementById("stats-row");
if (statsRow) statsObserver.observe(statsRow);

// ── Report cache (populated after successful analysis) ───────
let _lastReportData = null;
let _lastFormMeta   = null;

// ── Form submission ───────────────────────────────────────
const form = document.getElementById("predict-form");
const submitBtn = document.getElementById("form-submit-btn");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoader = submitBtn.querySelector(".btn-loader");
const resultPanel = document.getElementById("result-panel");
const resetBtn = document.getElementById("reset-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const imageFiles = document.getElementById("car-image").files;

  if (imageFiles.length === 0) {
    alert("Please upload a car photo.");
    return;
  }

  if (imageFiles.length > 1) {
    alert("Please upload only 1 car photo at a time.");
    return;
  }

  // Show loader
  btnText.style.display = "none";
  btnLoader.style.display = "inline-flex";
  submitBtn.disabled = true;

  try {
    const formData = new FormData();
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append("images", imageFiles[i]);
    }

    // Append vehicle details
    formData.append("car_brand", document.getElementById("car-brand").value);
    formData.append("car_model", document.getElementById("car-model").value);
    formData.append("car_variant", document.getElementById("car-variant").value);
    formData.append("car_type", document.getElementById("car-type").value);
    formData.append("year", document.getElementById("car-year").value);

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showResult(data);
      // Cache for PDF/Word report generation
      _lastReportData = data;
      _lastFormMeta = {
        brand:   document.getElementById("car-brand").value,
        model:   document.getElementById("car-model").value,
        variant: document.getElementById("car-variant").value,
        carType: document.getElementById("car-type").value,
        year:    document.getElementById("car-year").value,
      };
    } else {
      let errorMsg = data.analysis_message || "Unknown error";
      if (data.detail) {
        errorMsg = JSON.stringify(data.detail);
      }
      alert("Error: " + errorMsg);
    }
  } catch (error) {
    console.error("Error communicating with backend:", error);
    alert("Error: " + (error.message || "Failed to communicate with the backend server."));
  } finally {
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
    submitBtn.disabled = false;
  }
});

// ── Severity Logic ────────────────────────────────────────
const DAMAGE_SEVERITY_WEIGHT = {
  'scratch': 0,
  'dent': 1,
  'lamp broken': 1,
  'crack': 2,
  'glass shatter': 2,
  'tire flat': 3,
};

function getSeverity(damage_type, confidence) {
  const typeWeight = DAMAGE_SEVERITY_WEIGHT[damage_type] ?? 0;
  const confScore = confidence >= 80 ? 3 : confidence >= 60 ? 2 : confidence >= 35 ? 1 : 0;
  const score = typeWeight + confScore;

  if (score >= 5) return { label: 'CRITICAL', color: '#f87171', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.4)', dot: '#ef4444' };
  if (score >= 3) return { label: 'HIGH', color: '#fb923c', bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.4)', dot: '#f97316' };
  if (score >= 1) return { label: 'MEDIUM', color: '#facc15', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.35)', dot: '#eab308' };
  return { label: 'LOW', color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', dot: '#22c55e' };
}

const SEVERITY_MAP = {
  'LOW': { label: 'LOW', color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', dot: '#22c55e' },
  'MEDIUM': { label: 'MEDIUM', color: '#facc15', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.35)', dot: '#eab308' },
  'HIGH': { label: 'HIGH', color: '#fb923c', bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.4)', dot: '#f97316' },
  'CRITICAL': { label: 'CRITICAL', color: '#f87171', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.4)', dot: '#ef4444' },
};

function getOverallSev(detections) {
  if (!detections || detections.length === 0) return null;
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  let best = 0;
  detections.forEach(d => {
    const idx = order.indexOf(getSeverity(d.damage_type, d.confidence).label);
    if (idx > best) best = idx;
  });
  if (detections.length >= 5 && best < 3) best = Math.min(3, best + 1);
  return SEVERITY_MAP[order[best]];
}

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

function createCombinedPriceCard(cp, detections) {
  if (!cp) return null;
  const savings = Math.max(0, (cp.oem_total_estimate || 0) - (cp.aftermarket_total_estimate || 0));
  const gstPct  = cp.gst_rate > 1 ? cp.gst_rate.toFixed(1) : ((cp.gst_rate || 0.18) * 100).toFixed(0);

  const damageBadgesHTML = detections.map(d => `
    <span style="font-size:11px; padding:5px 12px; border-radius:20px; background:rgba(59,130,246,0.15); color:#93c5fd; border:1px solid rgba(59,130,246,0.3); display:inline-flex; align-items:center; gap:6px;">
      <strong style="text-transform:capitalize;">${d.damage_type}</strong> &nbsp;—&nbsp; ${d.car_part}
    </span>
  `).join("");

  const box = document.createElement("div");
  box.className = "combined-price-card";
  box.innerHTML = `
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:16px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 14px rgba(59,130,246,0.4);">
          🧮
        </div>
        <div>
          <h4 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 2px 0;letter-spacing:0.02em;">TOTAL DAMAGE REPAIR ESTIMATE</h4>
          <p style="font-size:12px;color:#94a3b8;margin:0;">${detections.length} damage${detections.length!==1?'s':''} detected &nbsp;·&nbsp; GST ${gstPct}% applied</p>
        </div>
      </div>
      ${savings > 0 ? `
      <span style="font-size:12px;font-weight:800;padding:7px 16px;border-radius:20px;background:rgba(34,197,94,0.16);color:#4ade80;border:1px solid rgba(34,197,94,0.4);">
        💰 Aftermarket saves ₹${fmt(savings)}
      </span>` : ''}
    </div>

    <!-- Big Totals -->
    <div class="price-totals-grid">
      <div style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.35);border-radius:14px;padding:18px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:0.08em;">OEM Total Estimate</div>
        <div style="font-size:28px;font-weight:900;color:#60a5fa;margin:6px 0 2px;">₹${fmt(cp.oem_total_estimate)}</div>
        <div style="font-size:10px;color:#64748b;">Subtotal ₹${fmt(cp.oem_subtotal_before_gst)} + GST ₹${fmt(cp.oem_gst_amount)}</div>
      </div>
      <div style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);border-radius:14px;padding:18px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:#a7f3d0;text-transform:uppercase;letter-spacing:0.08em;">Aftermarket Total</div>
        <div style="font-size:28px;font-weight:900;color:#34d399;margin:6px 0 2px;">₹${fmt(cp.aftermarket_total_estimate)}</div>
        <div style="font-size:10px;color:#64748b;">Subtotal ₹${fmt(cp.aftermarket_subtotal_before_gst)} + GST ₹${fmt(cp.aftermarket_gst_amount)}</div>
      </div>
    </div>

    <!-- Itemised Breakdown -->
    <div style="background:rgba(0,0,0,0.32);border-radius:12px;padding:18px;border:1px solid rgba(255,255,255,0.07);">
      <div style="font-size:11px;font-weight:700;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:14px;">
        Itemised Cost Breakdown
      </div>
      <div class="price-itemised-grid" style="font-size:12px;">
        ${[
          ['OEM Parts Price',        cp.total_oem_part_price,        '#93c5fd'],
          ['Aftermarket Parts Price', cp.total_aftermarket_part_price, '#a7f3d0'],
          ['Labour Charges',          cp.total_damage_labour,          '#fcd34d'],
          ['Installation Charges',    cp.total_damage_installation,    '#fcd34d'],
          ['Paint Cost',              cp.total_damage_paint,           '#fb923c'],
        ].filter(r => (r[1] || 0) > 0).map(([label, val, col]) => `
          <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed rgba(255,255,255,0.05);">
            <span style="color:#94a3b8;">${label}:</span>
            <span style="color:${col};font-weight:700;">₹${fmt(val)}</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed rgba(255,255,255,0.05);">
          <span style="color:#94a3b8;">Repair Items:</span>
          <span style="color:#818cf8;font-weight:700;">${cp.repair_item_count}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed rgba(255,255,255,0.05);">
          <span style="color:#94a3b8;">Replacement Items:</span>
          <span style="color:#f87171;font-weight:700;">${cp.replacement_item_count}</span>
        </div>
      </div>
    </div>

    <!-- Damage Badges -->
    <div>
      <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Damages Included:</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">${damageBadgesHTML}</div>
    </div>
  `;
  return box;
}


function showResult(data) {
  document.getElementById("analysis-message-text").textContent = "AI Analysis & Valuation Complete";

  const container = document.getElementById("results-container");
  container.innerHTML = "";

  const cardContainer = document.getElementById("predict-form-card");
  cardContainer.style.maxWidth = "1200px";

  data.results.forEach((res, index) => {
    const card = document.createElement("div");
    card.className = "analysis-result-card";

    if (!res.success) {
      card.innerHTML = `
        <h3 style="font-size:16px; color:var(--text);">Result ${index + 1}: ${res.filename}</h3>
        <p style="color:#f87171; font-weight:600;">${res.analysis_message}</p>
      `;
      container.appendChild(card);
      return;
    }

    const detections = res.detections || [];
    const overallSev = getOverallSev(detections);

    // ── Header ──────────────────────────────────────────────
    const header = document.createElement("div");
    header.style.cssText = "display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;";
    header.innerHTML = `
      <div>
        <h3 style="font-size:18px; font-weight:800; color:var(--text); margin:0 0 4px 0;">Car Photo: ${res.filename}</h3>
        <p style="font-size:13px; color:var(--text-muted); margin:0;">${detections.length} damage issue${detections.length !== 1 ? 's' : ''} detected by AI models</p>
      </div>
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span style="font-size:12px; padding:6px 16px; border-radius:20px; background:${detections.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}; color:${detections.length > 0 ? '#f87171' : '#4ade80'}; font-weight:700; border:1px solid ${detections.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'};">
          ${detections.length > 0 ? `⚠ ${detections.length} Damage${detections.length !== 1 ? 's' : ''} Found` : '✓ No Damage Detected'}
        </span>
      </div>
    `;
    card.appendChild(header);

    // ── Side by Side Images ──────────────────────────────────
    const imageGrid = document.createElement("div");
    imageGrid.className = "result-images-grid";

    const imgPanels = [
      { src: res.original_b64, label: "Original Car Image", badge: "Uploaded", accentColor: "rgba(255,255,255,0.06)", textColor: "var(--text-muted)", borderColor: "var(--border)" },
      { src: res.combined_b64 || res.original_b64, label: "AI Analyzed Result", badge: "AI Detected", accentColor: "var(--accent-glow)", textColor: "var(--accent-hover)", borderColor: "var(--accent)" }
    ];

    imgPanels.forEach(p => {
      const panel = document.createElement("div");
      panel.style.cssText = "display:flex; flex-direction:column; gap:10px;";
      panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:11px; font-weight:700; color:${p.textColor}; text-transform:uppercase; letter-spacing:0.07em;">${p.label}</span>
          <span style="font-size:10px; padding:3px 9px; border-radius:4px; background:${p.accentColor}; color:${p.textColor}; font-weight:600;">${p.badge}</span>
        </div>
        <img src="${p.src}" style="width:100%; border-radius:12px; border:1px solid ${p.borderColor}; object-fit:cover; box-shadow:0 4px 20px rgba(0,0,0,0.3);" />
      `;
      imageGrid.appendChild(panel);
    });
    card.appendChild(imageGrid);

    // ── Dashboard: Damage & Price Breakdown ─────────────────
    const dashSection = document.createElement("div");
    dashSection.style.cssText = "display:flex; flex-direction:column; gap:16px;";

    const dashHeader = document.createElement("div");
    dashHeader.style.cssText = "display:flex; align-items:center; gap:10px; padding-bottom:12px; border-bottom:1px solid var(--border);";
    dashHeader.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span style="font-size:13px; font-weight:700; color:var(--text); text-transform:uppercase; letter-spacing:0.06em;">Damage & Price Breakdown</span>
    `;
    dashSection.appendChild(dashHeader);

    if (detections.length === 0) {
      dashSection.innerHTML += `
        <div style="text-align:center; padding:32px; border:1px dashed var(--border); border-radius:12px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">✅</div>
          <p style="margin:0; font-size:14px; font-weight:600; color:#4ade80;">No structural damage detected</p>
          <p style="margin:4px 0 0; font-size:12px;">This vehicle appears to be in good condition.</p>
        </div>
      `;
    } else {
      // Render the single combined price card from backend price.keras result
      const combinedCard = createCombinedPriceCard(res.combined_price, detections);
      if (combinedCard) dashSection.appendChild(combinedCard);

      // 2. Render Header for Individual Damage Breakdown Cards
      const indLabel = document.createElement("div");
      indLabel.style.cssText = "font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; margin-top:8px;";
      indLabel.textContent = "Individual Damage Breakdown Items";
      dashSection.appendChild(indLabel);

      const colGrid = document.createElement("div");
      colGrid.className = "damage-cards-grid";

      const damageColors = {
        'dent': { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#fb923c', icon: '🔨' },
        'scratch': { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', text: '#eab308', icon: '✂️' },
        'crack': { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171', icon: '⚡' },
        'glass shatter': { bg: 'rgba(147,51,234,0.12)', border: 'rgba(147,51,234,0.3)', text: '#c084fc', icon: '💎' },
        'lamp broken': { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', icon: '💡' },
        'tire flat': { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399', icon: '🛞' },
      };

      detections.forEach(d => {
        const col = damageColors[d.damage_type] || { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8', icon: '⚠️' };
        const confBarWidth = Math.min(100, d.confidence);
        const confBarColor = d.confidence >= 70 ? '#f87171' : d.confidence >= 40 ? '#fb923c' : '#facc15';
        const sev = getSeverity(d.damage_type, d.confidence);

        const dmgCard = document.createElement("div");
        dmgCard.style.cssText = `
          background: ${col.bg};
          border: 1px solid ${col.border};
          border-radius: 14px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        `;
        dmgCard.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:22px;">${col.icon}</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:10px; padding:2px 8px; border-radius:8px; background:rgba(255,255,255,0.06); color:var(--text-muted); font-weight:600;">${d.model_type === 'Segmentation Model' ? 'SEG' : 'DET'}</span>
            </div>
          </div>
          <div>
            <div style="font-size:15px; font-weight:800; color:${col.text}; text-transform:capitalize; margin-bottom:4px;">${d.damage_type}</div>
            <div style="font-size:12px; color:var(--text-muted);">
              Part: <span style="background:rgba(59,130,246,0.15); color:#60a5fa; padding:2px 7px; border-radius:4px; font-weight:600;">${d.car_part}</span>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
              <span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">AI Confidence</span>
              <span style="font-size:11px; font-weight:700; color:${confBarColor};">${d.confidence}%</span>
            </div>
            <div style="background:rgba(255,255,255,0.06); border-radius:4px; height:5px; overflow:hidden;">
              <div style="width:${confBarWidth}%; height:100%; background:${confBarColor}; border-radius:4px; transition:width 0.8s ease;"></div>
            </div>
          </div>
        `;

        colGrid.appendChild(dmgCard);
      });

      dashSection.appendChild(colGrid);
    }
    card.appendChild(dashSection);
    container.appendChild(card);
  });

  form.style.display = "none";
  resultPanel.style.display = "block";
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  form.reset();
  const cardContainer = document.getElementById("predict-form-card");
  cardContainer.style.maxWidth = "720px";
  form.style.display = "flex";
  resultPanel.style.display = "none";
}

if (resetBtn) resetBtn.addEventListener("click", resetForm);

// ── Scroll-reveal animations ──────────────────────────────
const revealEls = document.querySelectorAll(
  ".process-card, .dash-card, .stat-item, .feature-item"
);
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }, i * 80);
        revealObs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealEls.forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  revealObs.observe(el);
});

// ── PDF Download Handler ─────────────────────────────────
const downloadPdfBtn = document.getElementById("download-pdf-btn");



function buildReportHTML(data, meta) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });

  let sectionsHTML = '';

  (data.results || []).forEach((res, idx) => {
    if (!res.success) return;

    const det = res.detections || [];
    const cp  = res.combined_price;

    // ── Images ──
    const origImg = res.original_b64
      ? `<img src="${res.original_b64}" style="width:48%;border-radius:8px;border:2px solid #e2e8f0;object-fit:cover;max-height:280px;" />`
      : '';
    const aiImg = (res.combined_b64 || res.original_b64)
      ? `<img src="${res.combined_b64 || res.original_b64}" style="width:48%;border-radius:8px;border:2px solid #3b82f6;object-fit:cover;max-height:280px;" />`
      : '';

    // ── Damage rows ──
    let dmgRows = '';
    det.forEach((d, i) => {
      dmgRows += `
        <tr style="background:${i%2===0?'#f8fafc':'#fff'}">
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;text-transform:capitalize;">${d.damage_type}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;">${d.car_part}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;">${d.confidence}%</td>
        </tr>`;
    });

    // ── Price section ──
    let priceHTML = '';
    if (cp) {
      const fmt = n => Number(n||0).toLocaleString('en-IN');
      const savings = Math.max(0, (cp.oem_total_estimate||0) - (cp.aftermarket_total_estimate||0));
      const gstPct  = cp.gst_rate > 1 ? cp.gst_rate.toFixed(1) : ((cp.gst_rate||0.18)*100).toFixed(0);
      priceHTML = `
        <div style="margin-top:28px;">
          <h3 style="font-size:15px;font-weight:800;color:#1e293b;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #3b82f6;">
            💰 Repair Cost Estimate
          </h3>
          <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;">
            <div style="flex:1;min-width:200px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #3b82f6;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">OEM Total Estimate</div>
              <div style="font-size:30px;font-weight:900;color:#1d4ed8;">₹${fmt(cp.oem_total_estimate)}</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">Subtotal ₹${fmt(cp.oem_subtotal_before_gst)} + GST ${gstPct}% (₹${fmt(cp.oem_gst_amount)})</div>
            </div>
            <div style="flex:1;min-width:200px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Aftermarket Total</div>
              <div style="font-size:30px;font-weight:900;color:#16a34a;">₹${fmt(cp.aftermarket_total_estimate)}</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">Subtotal ₹${fmt(cp.aftermarket_subtotal_before_gst)} + GST ${gstPct}% (₹${fmt(cp.aftermarket_gst_amount)})</div>
            </div>
          </div>
          ${savings > 0 ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:13px;color:#15803d;font-weight:700;">
            💡 Aftermarket parts save you <strong>₹${fmt(savings)}</strong> compared to OEM.
          </div>` : ''}
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:9px 12px;border:1px solid #e2e8f0;text-align:left;color:#475569;font-weight:700;">Cost Component</th>
                <th style="padding:9px 12px;border:1px solid #e2e8f0;text-align:right;color:#475569;font-weight:700;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${[
                ['OEM Parts Price',          cp.total_oem_part_price],
                ['Aftermarket Parts Price',   cp.total_aftermarket_part_price],
                ['Labour Charges',            cp.total_damage_labour],
                ['Installation Charges',      cp.total_damage_installation],
                ['Paint Cost',                cp.total_damage_paint],
              ].filter(r => (r[1]||0) > 0).map(([l,v], i) => `
                <tr style="background:${i%2===0?'#f8fafc':'#fff'}">
                  <td style="padding:8px 12px;border:1px solid #e2e8f0;">${l}</td>
                  <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;">₹${fmt(v)}</td>
                </tr>`).join('')}
              <tr style="background:#f8fafc;">
                <td style="padding:8px 12px;border:1px solid #e2e8f0;">Repair Items</td>
                <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;">${cp.repair_item_count}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:8px 12px;border:1px solid #e2e8f0;">Replacement Items</td>
                <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;">${cp.replacement_item_count}</td>
              </tr>
            </tbody>
          </table>
        </div>`;
    }

    sectionsHTML += `
      <div style="margin-bottom:40px;page-break-inside:avoid;">
        <h2 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">
          Analysis Result — ${res.filename || ('Image '+(idx+1))}
        </h2>
        <p style="font-size:13px;color:#64748b;margin:0 0 20px 0;">
          ${det.length} damage issue${det.length!==1?'s':''} detected by AI
        </p>

        <!-- Images -->
        <div style="display:flex;gap:16px;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;">
          <div style="text-align:center;flex:1;">
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Original Car Image</div>
            ${origImg}
          </div>
          <div style="text-align:center;flex:1;">
            <div style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin-bottom:6px;">AI Analyzed Result</div>
            ${aiImg}
          </div>
        </div>

        <!-- Damage Table -->
        ${det.length > 0 ? `
        <h3 style="font-size:14px;font-weight:800;color:#1e293b;margin:0 0 12px 0;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">
          🔍 Detected Damages (${det.length})
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px;">
          <thead>
            <tr style="background:#1e293b;color:#fff;">
              <th style="padding:9px 12px;border:1px solid #334155;text-align:left;">Damage Type</th>
              <th style="padding:9px 12px;border:1px solid #334155;text-align:left;">Car Part</th>
              <th style="padding:9px 12px;border:1px solid #334155;text-align:left;">Confidence</th>
            </tr>
          </thead>
          <tbody>${dmgRows}</tbody>
        </table>` : `
        <div style="padding:20px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;text-align:center;color:#16a34a;font-weight:700;">
          ✅ No damage detected — vehicle appears to be in good condition.
        </div>`}

        ${priceHTML}
      </div>`;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>RepairLensAI — Damage & Valuation Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1e293b; background: #fff; padding: 32px; font-size: 13px; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none !important; }
      img { max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <!-- Report Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #3b82f6;">
    <div>
      <div style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">
        🔍 RepairLens <span style="color:#3b82f6;">AI</span>
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
        Damage Detection & Repair Cost Estimation Report
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#64748b;">Generated on</div>
      <div style="font-size:13px;font-weight:700;color:#1e293b;">${dateStr} at ${timeStr}</div>
    </div>
  </div>

  <!-- Car Details -->
  ${meta ? `
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Vehicle Details</div>
    <div style="display:flex;flex-wrap:wrap;gap:16px 32px;">
      ${[
        ['Brand',   meta.brand],
        ['Model',   meta.model],
        ['Variant', meta.variant],
        ['Fuel Type', meta.carType],
        ['Year',    meta.year],
      ].map(([k,v]) => `
        <div>
          <span style="font-size:11px;color:#94a3b8;display:block;">${k}</span>
          <span style="font-size:14px;font-weight:700;color:#0f172a;">${v||'-'}</span>
        </div>`).join('')}
    </div>
  </div>` : ''}

  <!-- Results -->
  ${sectionsHTML}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;">
    <span>RepairLensAI — AI-Powered Car Damage & Valuation Platform</span>
    <span>Report ID: RL-${Date.now()}</span>
  </div>
</body>
</html>`;
}

function triggerPrintReport(htmlContent) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(htmlContent);
  iframe.contentDocument.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 800);
}

if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener("click", () => {
    if (!_lastReportData || !(_lastReportData.results || []).length) {
      alert("No report data available to download.");
      return;
    }
    const html = buildReportHTML(_lastReportData, _lastFormMeta);
    triggerPrintReport(html);
  });
}

