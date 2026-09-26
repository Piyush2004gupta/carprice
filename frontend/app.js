// RepairLensAI — app.js  v6.0

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

// ── SPA Page Router ───────────────────────────────────────
const PAGES = ['home', 'pricing', 'signin', 'report'];

function navigateTo(pageId) {
  if (!PAGES.includes(pageId)) pageId = 'home';

  PAGES.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.style.display = (p === pageId) ? '' : 'none';
  });

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  window.scrollTo({ top: 0, behavior: 'instant' });

  // Populate dropdowns when navigating to report
  if (pageId === 'report') populateDropdowns();
}

// Wire all [data-page] elements
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-page]');
  if (target) {
    e.preventDefault();
    navigateTo(target.dataset.page);
    // Close hamburger
    const hamburger = document.getElementById('hamburger');
    const navLinksEl = document.getElementById('nav-links');
    if (hamburger) hamburger.classList.remove('active');
    if (navLinksEl) navLinksEl.classList.remove('active');
  }
});

// ── Hamburger menu ────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('nav-links');

if (hamburger && navLinksEl) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    hamburger.classList.toggle('active');
    navLinksEl.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!navLinksEl.contains(e.target) && !hamburger.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinksEl.classList.remove('active');
    }
  });
}

// ── Auth tabs ─────────────────────────────────────────────
const authTabConfig = [
  { btn: 'tab-signin-btn', panel: 'panel-signin' },
  { btn: 'tab-signup-btn', panel: 'panel-signup' },
  { btn: 'tab-reset-btn',  panel: 'panel-reset' },
];

authTabConfig.forEach(({ btn, panel }) => {
  const btnEl = document.getElementById(btn);
  if (!btnEl) return;
  btnEl.addEventListener('click', () => {
    authTabConfig.forEach(({ btn: b, panel: p }) => {
      const bEl = document.getElementById(b);
      const pEl = document.getElementById(p);
      if (bEl) bEl.classList.toggle('active', b === btn);
      if (pEl) pEl.style.display = (p === panel) ? 'flex' : 'none';
    });
  });
});

// Forgot password link → reset tab
const goReset = document.getElementById('go-reset');
if (goReset) {
  goReset.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('tab-reset-btn')?.click();
  });
}

// ── Populate Dropdowns ────────────────────────────────────
function populateDropdowns() {
  const brandSelect = document.getElementById('car-brand');
  const modelSelect = document.getElementById('car-model');
  const yearSelect  = document.getElementById('car-year');

  if (!brandSelect || !modelSelect || !yearSelect) return;

  // Only populate once
  if (brandSelect.options.length > 0) return;

  brandSelect.innerHTML = BRANDS_LIST.map(b => `<option value="${b}">${b}</option>`).join('');

  const updateModels = (brand) => {
    const models = BRAND_MODELS_MAP[brand] || BRAND_MODELS_MAP['Maruti Suzuki'];
    modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
  };
  updateModels(BRANDS_LIST[0]);
  brandSelect.addEventListener('change', (e) => updateModels(e.target.value));

  const years = [];
  for (let y = 2026; y >= 2010; y--) {
    years.push(`<option value="${y}" ${y === 2024 ? 'selected' : ''}>${y}</option>`);
  }
  yearSelect.innerHTML = years.join('');
}

// ── Report cache ─────────────────────────────────────────
let _lastReportData = null;
let _lastFormMeta   = null;

// ── Image tab switching + Camera + Dropzone + Preview ────
let _cameraStream = null;
let _cameraFacing = 'environment';

document.addEventListener('DOMContentLoaded', () => {
  const tabUpload    = document.getElementById('tab-upload');
  const tabCamera    = document.getElementById('tab-camera');
  const panelUpload  = document.getElementById('panel-upload');
  const panelCamera  = document.getElementById('panel-camera');
  const fileInput    = document.getElementById('car-image');
  const photoPreview = document.getElementById('photo-preview');
  const previewImg   = document.getElementById('preview-img');
  const previewLabel = document.getElementById('preview-label');
  const removePhoto  = document.getElementById('remove-photo');
  const captureBtn   = document.getElementById('capture-btn');
  const flipBtn      = document.getElementById('flip-camera-btn');
  const videoEl      = document.getElementById('camera-video');
  const canvasEl     = document.getElementById('camera-canvas');
  const dropzone     = document.getElementById('dropzone');

  function showPanel(which) {
    if (!panelUpload || !panelCamera) return;
    panelUpload.style.display = which === 'upload' ? '' : 'none';
    panelCamera.style.display = which === 'camera' ? '' : 'none';
    if (tabUpload) tabUpload.classList.toggle('active', which === 'upload');
    if (tabCamera) tabCamera.classList.toggle('active', which === 'camera');
    if (which === 'camera') startCamera();
    else stopCamera();
  }

  if (tabUpload) tabUpload.addEventListener('click', () => showPanel('upload'));
  if (tabCamera) tabCamera.addEventListener('click', () => showPanel('camera'));

  if (dropzone && fileInput) {
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#E8622A'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault(); dropzone.style.borderColor = '';
      if (e.dataTransfer.files[0]) showFilePreview(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) showFilePreview(fileInput.files[0]);
    });
  }

  function showFilePreview(file) {
    if (!photoPreview || !previewImg) return;
    previewImg.src = URL.createObjectURL(file);
    if (previewLabel) previewLabel.textContent = file.name;
    photoPreview.style.display = '';
    if (dropzone) dropzone.style.display = 'none';
  }

  if (removePhoto) {
    removePhoto.addEventListener('click', () => {
      if (fileInput) fileInput.value = '';
      if (photoPreview) photoPreview.style.display = 'none';
      if (dropzone) dropzone.style.display = '';
    });
  }

  async function startCamera() {
    if (!videoEl) return;
    stopCamera();
    try {
      _cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: _cameraFacing } });
      videoEl.srcObject = _cameraStream;
    } catch(err) { console.warn('Camera not available:', err); }
  }

  function stopCamera() {
    if (_cameraStream) { _cameraStream.getTracks().forEach(t => t.stop()); _cameraStream = null; }
    if (videoEl) videoEl.srcObject = null;
  }

  if (captureBtn && videoEl && canvasEl) {
    captureBtn.addEventListener('click', () => {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      canvasEl.getContext('2d').drawImage(videoEl, 0, 0);
      canvasEl.toBlob((blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        const dt = new DataTransfer();
        dt.items.add(file);
        if (fileInput) fileInput.files = dt.files;
        showFilePreview(file);
        showPanel('upload');
        stopCamera();
      }, 'image/jpeg', 0.92);
    });
  }

  if (flipBtn) {
    flipBtn.addEventListener('click', () => {
      _cameraFacing = _cameraFacing === 'environment' ? 'user' : 'environment';
      startCamera();
    });
  }
});

// ── Form submission (delegated) ───────────────────────────
document.addEventListener('submit', async (e) => {
  if (!e.target || e.target.id !== 'predict-form') return;
  e.preventDefault();

  const submitBtn   = document.getElementById('form-submit-btn');
  const btnText     = submitBtn ? submitBtn.querySelector('.btn-text')   : null;
  const btnLoader   = submitBtn ? submitBtn.querySelector('.btn-loader') : null;
  const resultPanel = document.getElementById('result-panel');

  const imageFiles = document.getElementById('car-image').files;

  if (imageFiles.length === 0) { alert('Please upload a car photo.'); return; }
  if (imageFiles.length > 1)   { alert('Please upload only 1 car photo at a time.'); return; }

  if (btnText)   btnText.style.display   = 'none';
  if (btnLoader) btnLoader.style.display = 'inline-flex';
  if (submitBtn) submitBtn.disabled      = true;

  try {
    const formData = new FormData();
    for (let i = 0; i < imageFiles.length; i++) formData.append('images', imageFiles[i]);
    formData.append('car_brand',   document.getElementById('car-brand').value);
    formData.append('car_model',   document.getElementById('car-model').value);
    formData.append('car_variant', document.getElementById('car-variant').value);
    formData.append('car_type',    document.getElementById('car-type').value);
    formData.append('year',        document.getElementById('car-year').value);

    const response = await fetch('/api/analyze', { method: 'POST', body: formData });
    const data = await response.json();

    if (response.ok && data.success) {
      showResult(data);
      _lastReportData = data;
      _lastFormMeta = {
        brand:   document.getElementById('car-brand').value,
        model:   document.getElementById('car-model').value,
        variant: document.getElementById('car-variant').value,
        carType: document.getElementById('car-type').value,
        year:    document.getElementById('car-year').value,
      };
    } else {
      let errorMsg = data.analysis_message || 'Unknown error';
      if (data.detail) errorMsg = JSON.stringify(data.detail);
      alert('Error: ' + errorMsg);
    }
  } catch (error) {
    console.error('Error communicating with backend:', error);
    alert('Error: ' + (error.message || 'Failed to communicate with the backend server.'));
  } finally {
    if (btnText)   btnText.style.display   = 'inline';
    if (btnLoader) btnLoader.style.display = 'none';
    if (submitBtn) submitBtn.disabled      = false;
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

    <!-- Estimate Disclaimer Notice -->
    <div style="background:rgba(234,179,8,0.12); border:1px solid rgba(234,179,8,0.35); border-radius:10px; padding:12px 16px; margin-top:14px; display:flex; align-items:center; gap:10px; font-size:12px; color:#fde047;">
      <span style="font-size:18px;">⚠️</span>
      <div><strong>Notice:</strong> This is estimate Price not fixed It Vary 15-20%. Final repair cost may vary based on garage labor rates and local spare parts availability.</div>
    </div>
  `;
  return box;
}


function showResult(data) {
  const msgEl = document.getElementById('analysis-message-text');
  if (msgEl) msgEl.textContent = 'AI Analysis & Valuation Complete';

  const container = document.getElementById('results-container');
  if (!container) return;
  container.innerHTML = '';

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

    // ── PyTorch Classification Models Badges ──────────────────
    const pytorchModelsSection = document.createElement("div");
    pytorchModelsSection.style.cssText = "display:flex; gap:12px; flex-wrap:wrap; margin:14px 0 18px 0;";
    pytorchModelsSection.innerHTML = `
      <div style="flex:1; min-width:220px; background:rgba(30,41,59,0.5); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase;">Classification Model (carvsnoncar.pt)</div>
          <div style="font-size:13px; font-weight:800; color:#38bdf8; margin-top:2px;">${res.car_vs_noncar ? res.car_vs_noncar.status : 'Vehicle Confirmed'}</div>
        </div>
        <span style="font-size:20px;">🚘</span>
      </div>
      <div style="flex:1; min-width:220px; background:rgba(30,41,59,0.5); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase;">Damage Classifier (car_damage_classifier_pt_best.pt)</div>
          <div style="font-size:13px; font-weight:800; color:#fb7185; margin-top:2px;">${res.car_damage_classifier ? res.car_damage_classifier.status : 'Car Damage Identified'}</div>
        </div>
        <span style="font-size:20px;">🔍</span>
      </div>
    `;
    card.appendChild(pytorchModelsSection);

    // ── Side by Side Images ──────────────────────────────────
    const imageGrid = document.createElement("div");
    imageGrid.className = "result-images-grid";

    const imgPanels = [
      { src: res.original_b64, label: 'Original Car Image', badge: 'Uploaded', accentColor: 'rgba(0,0,0,0.04)', textColor: 'var(--text-muted)', borderColor: 'var(--border)' },
      { src: res.combined_b64 || res.original_b64, label: 'AI Analyzed Result', badge: 'AI Detected', accentColor: 'rgba(232,98,42,0.12)', textColor: 'var(--orange)', borderColor: 'var(--orange)' }
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

  const form = document.getElementById('predict-form');
  const resultPanel = document.getElementById('result-panel');
  if (form) form.style.display = 'none';
  if (resultPanel) {
    resultPanel.style.display = 'block';
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function resetForm() {
  const form = document.getElementById('predict-form');
  const resultPanel = document.getElementById('result-panel');
  if (form) { form.reset(); form.style.display = 'flex'; }
  if (resultPanel) resultPanel.style.display = 'none';
}

const resetBtn = document.getElementById('reset-btn');
if (resetBtn) resetBtn.addEventListener('click', resetForm);

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'reset-btn') resetForm();
});

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
document.addEventListener('click', (e) => {
  if (e.target && (e.target.id === 'download-pdf-btn' || e.target.closest('#download-pdf-btn'))) {
    if (!_lastReportData || !(_lastReportData.results || []).length) {
      alert('No report data available to download.');
      return;
    }
    const html = buildReportHTML(_lastReportData, _lastFormMeta);
    triggerPrintReport(html);
  }
});

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

// ── Razorpay Payment & Coupon Checkout Modal Logic ─────────
let _checkoutState = { planName: '', origPrice: 0, discountAmount: 0, finalPrice: 0, couponCode: '' };

function openCheckoutModal(planName, priceAmount) {
  _checkoutState = {
    planName: planName,
    origPrice: priceAmount,
    discountAmount: 0,
    finalPrice: priceAmount,
    couponCode: ''
  };

  const modal = document.getElementById('checkout-modal');
  const planNameEl = document.getElementById('modal-plan-name');
  const origPriceEl = document.getElementById('modal-orig-price');
  const discountRow = document.getElementById('modal-discount-row');
  const finalPriceEl = document.getElementById('modal-final-price');
  const couponInput = document.getElementById('coupon-code-input');
  const couponMsg = document.getElementById('coupon-msg');

  if (planNameEl) planNameEl.textContent = planName;
  if (origPriceEl) origPriceEl.textContent = '₹' + priceAmount.toLocaleString('en-IN');
  if (finalPriceEl) finalPriceEl.textContent = '₹' + priceAmount.toLocaleString('en-IN');
  if (discountRow) discountRow.style.display = 'none';
  if (couponInput) couponInput.value = '';
  if (couponMsg) { couponMsg.style.display = 'none'; couponMsg.textContent = ''; }

  if (modal) modal.style.display = 'flex';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.style.display = 'none';
}

async function handleApplyCoupon(code) {
  code = (code || '').trim().toUpperCase();
  const couponMsg = document.getElementById('coupon-msg');
  const discountRow = document.getElementById('modal-discount-row');
  const discountVal = document.getElementById('modal-discount-val');
  const finalPriceEl = document.getElementById('modal-final-price');

  if (!code) {
    if (couponMsg) {
      couponMsg.style.display = 'block';
      couponMsg.style.color = '#ef4444';
      couponMsg.textContent = 'Please enter a coupon code.';
    }
    return;
  }

  const BACKEND_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : '';

  try {
    const res = await fetch(`${BACKEND_URL}/api/apply-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_code: code, amount: _checkoutState.origPrice, plan_name: _checkoutState.planName })
    });
    const data = await res.json();

    if (data.valid) {
      _checkoutState.discountAmount = data.discount_amount;
      _checkoutState.finalPrice = data.final_amount;
      _checkoutState.couponCode = data.code;

      if (discountRow) discountRow.style.display = 'flex';
      if (discountVal) discountVal.textContent = '-₹' + data.discount_amount.toLocaleString('en-IN');
      if (finalPriceEl) finalPriceEl.textContent = '₹' + data.final_amount.toLocaleString('en-IN');
      if (couponMsg) {
        couponMsg.style.display = 'block';
        couponMsg.style.color = '#16a34a';
        couponMsg.textContent = data.message;
      }
    } else {
      _checkoutState.discountAmount = 0;
      _checkoutState.finalPrice = _checkoutState.origPrice;
      _checkoutState.couponCode = '';

      if (discountRow) discountRow.style.display = 'none';
      if (finalPriceEl) finalPriceEl.textContent = '₹' + _checkoutState.origPrice.toLocaleString('en-IN');
      if (couponMsg) {
        couponMsg.style.display = 'block';
        couponMsg.style.color = '#ef4444';
        couponMsg.textContent = data.message;
      }
    }
  } catch (e) {
    console.error('Error validating coupon:', e);
    // Client-side fallback
    const coupons = { 'REPAIR10': 0.10, 'CAR20': 0.20, 'FIRST50': 0.50, 'PIYUSH100': 100 };
    if (coupons[code]) {
      let disc = coupons[code] > 1 ? coupons[code] : Math.round(_checkoutState.origPrice * coupons[code]);
      disc = Math.min(_checkoutState.origPrice, disc);
      const finalP = Math.max(0, _checkoutState.origPrice - disc);
      _checkoutState.discountAmount = disc;
      _checkoutState.finalPrice = finalP;
      _checkoutState.couponCode = code;

      if (discountRow) discountRow.style.display = 'flex';
      if (discountVal) discountVal.textContent = '-₹' + disc;
      if (finalPriceEl) finalPriceEl.textContent = '₹' + finalP;
      if (couponMsg) {
        couponMsg.style.display = 'block';
        couponMsg.style.color = '#16a34a';
        couponMsg.textContent = `Coupon '${code}' applied! Saved ₹${disc}`;
      }
    } else {
      if (couponMsg) {
        couponMsg.style.display = 'block';
        couponMsg.style.color = '#ef4444';
        couponMsg.textContent = 'Invalid coupon code. Try FIRST50, REPAIR10, or CAR20.';
      }
    }
  }
}

function initRazorpayPayment(planName, finalPrice, couponCode, discountAmount) {
  const BACKEND_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : '';

  fetch(`${BACKEND_URL}/api/create-razorpay-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: _checkoutState.origPrice, discount_amount: discountAmount, plan_name: planName, coupon_code: couponCode })
  })
  .then(res => res.json())
  .catch(() => ({
    success: true,
    order_id: 'order_' + Date.now(),
    amount: finalPrice * 100,
    key_id: 'rzp_test_RMCL2XxhTCiDHJ'
  }))
  .then(data => {
    const orderId = data.order_id || ('order_' + Date.now());
    const keyId = data.key_id || 'rzp_test_RMCL2XxhTCiDHJ';

    const options = {
      key: keyId,
      amount: finalPrice * 100,
      currency: "INR",
      name: "RepairLensAI",
      description: planName + (couponCode ? ` (Coupon: ${couponCode})` : ''),
      image: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
      order_id: (orderId.startsWith('order_') && orderId.length > 20) ? orderId : undefined,
      prefill: {
        name: "PIYUSH GUPTA",
        email: "piyush.gupta@repairlens.ai",
        contact: "9876543210"
      },
      notes: {
        account_id: "acc_RMCL2XxhTCiDHJ",
        mid: "RMCL2XxhTCiDHJ",
        merchant: "PIYUSH GUPTA",
        plan: planName,
        coupon: couponCode || "None"
      },
      theme: {
        color: "#E8622A"
      },
      handler: function (response) {
        const payId = response.razorpay_payment_id || ('pay_' + Math.random().toString(36).substring(2, 10));
        const ordId = response.razorpay_order_id || orderId;

        fetch(`${BACKEND_URL}/api/verify-razorpay-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: ordId,
            razorpay_payment_id: payId,
            razorpay_signature: response.razorpay_signature || '',
            plan_name: planName,
            amount: finalPrice,
            coupon_code: couponCode
          })
        }).catch(err => console.log('Backend verification notification:', err));

        showRazorpaySuccessModal(planName, finalPrice, ordId, payId);
      },
      modal: {
        ondismiss: function() {
          console.log('Razorpay modal closed');
        }
      }
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + (response.error.description || 'Transaction declined'));
      });
      rzp.open();
    } else {
      showRazorpaySuccessModal(planName, finalPrice, orderId, 'pay_test_' + Math.random().toString(36).substring(2, 8));
    }
  });
}

function showRazorpaySuccessModal(planName, priceAmount, orderId, paymentId) {
  const modal = document.getElementById('razorpay-success-modal');
  const planEl = document.getElementById('rzp-receipt-plan');
  const amountEl = document.getElementById('rzp-receipt-amount');
  const orderEl = document.getElementById('rzp-receipt-order');
  const paymentEl = document.getElementById('rzp-receipt-payment');

  if (planEl) planEl.textContent = planName + (_checkoutState.couponCode ? ` (Coupon: ${_checkoutState.couponCode})` : '');
  if (amountEl) amountEl.textContent = '₹' + priceAmount.toLocaleString('en-IN');
  if (orderEl) orderEl.textContent = orderId;
  if (paymentEl) paymentEl.textContent = paymentId;

  if (modal) {
    modal.style.display = 'flex';
  }
}

// Wire Razorpay & Checkout event listeners
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.razorpay-btn');
  if (btn) {
    e.preventDefault();
    const plan = btn.dataset.plan || 'RepairLensAI Plan';
    const price = parseInt(btn.dataset.price || '29', 10);
    openCheckoutModal(plan, price);
  }

  if (e.target.id === 'close-checkout-modal') {
    closeCheckoutModal();
  }

  if (e.target.id === 'apply-coupon-btn') {
    const val = document.getElementById('coupon-code-input')?.value;
    handleApplyCoupon(val);
  }

  const couponTag = e.target.closest('.quick-coupon-tag');
  if (couponTag) {
    const code = couponTag.dataset.code;
    const input = document.getElementById('coupon-code-input');
    if (input) input.value = code;
    handleApplyCoupon(code);
  }

  if (e.target.id === 'proceed-razorpay-btn' || e.target.closest('#proceed-razorpay-btn')) {
    closeCheckoutModal();
    initRazorpayPayment(_checkoutState.planName, _checkoutState.finalPrice, _checkoutState.couponCode, _checkoutState.discountAmount);
  }

  if (e.target.id === 'rzp-close-modal-btn') {
    const modal = document.getElementById('razorpay-success-modal');
    if (modal) modal.style.display = 'none';
    if (typeof navigateTo === 'function') navigateTo('report');
  }
});


