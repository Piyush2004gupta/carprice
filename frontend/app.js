// RepairLensAI — app.js v9.0 (Direct Database Auth)

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
const PAGES = ['home', 'signin', 'report'];
const AUTH_STORAGE_KEY = 'repairlens_auth_user';

function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session && session.token ? session.user : null;
  } catch (error) {
    return null;
  }
}

function getAuthSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function setStoredUser(session) {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const session = getAuthSession();
  if (session && session.token) headers.set('Authorization', `Bearer ${session.token}`);
  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  let data = {};
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  } else {
    const rawText = await response.text().catch(() => '');
    if (!response.ok) {
      throw new Error(`Server error (${response.status}): ${rawText.slice(0, 100) || 'Non-JSON response'}`);
    }
  }
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status}).`);
  return data;
}

async function refreshCurrentUser() {
  const session = getAuthSession();
  if (!session) return null;
  try {
    const user = await apiRequest('/api/auth/me');
    const updated = { ...session, user };
    setStoredUser(updated);
    renderAuthState();
    return user;
  } catch (error) {
    setStoredUser(null);
    renderAuthState();
    return null;
  }
}

function userLogout() {
  setStoredUser(null);
  renderAuthState();
  if (typeof navigateTo === 'function') navigateTo('home');
}

function renderAuthState() {
  const user = getStoredUser();
  const badge = document.getElementById('nav-user-badge');
  const logoutBtn = document.getElementById('logout-btn');
  const navSignin = document.getElementById('nav-signin');
  const heroSignin = document.getElementById('hero-signin');

  const isLoggedIn = !!(user && user.email);

  if (badge) {
    if (isLoggedIn) {
      const displayName = user.name || user.email.split('@')[0];
      badge.innerHTML = `<span class="user-dot"></span>${displayName}`;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // Show/hide Sign out button
  if (logoutBtn) {
    logoutBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';
  }

  // Hide 'Sign in' nav link when logged in
  if (navSignin) {
    const parentLi = navSignin.closest('li');
    if (parentLi) {
      parentLi.style.display = isLoggedIn ? 'none' : '';
    }
  }

  // Show/hide 'My History' nav link when logged in
  const navHistoryLi = document.getElementById('nav-history-li');
  if (navHistoryLi) {
    navHistoryLi.style.display = isLoggedIn ? '' : 'none';
  }

  // Hide hero 'Sign in / Sign up' button when logged in
  if (heroSignin) {
    heroSignin.style.display = isLoggedIn ? 'none' : '';
  }
}

async function openDashboardModal() {
  const user = getStoredUser();
  if (!user) return;
  const modal = document.getElementById('dashboard-modal');
  const userInfo = document.getElementById('dashboard-user-info');
  const historyList = document.getElementById('dashboard-history-list');
  if (!modal) return;

  modal.style.display = 'flex';

  if (userInfo) {
    userInfo.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <h4 style="font-size:16px; font-weight:700; color:#0f172a; margin:0;">${user.name || 'User Account'}</h4>
          <p style="font-size:13px; color:#64748b; margin:2px 0 0 0;">${user.email}${user.phone ? ' &bull; ' + user.phone : ''}</p>
        </div>
      </div>
    `;
  }

  if (historyList) {
    historyList.innerHTML = `<p style="color:#64748b; font-size:13px; text-align:center; padding:20px;">⏳ Loading your predictions...</p>`;
    try {
      const data = await apiRequest('/api/user/predictions');
      if (!data || data.length === 0) {
        historyList.innerHTML = `<div style="text-align:center; padding:32px; color:#94a3b8; font-size:13px; background:#f8fafc; border-radius:10px;">📋 No saved predictions found yet. Upload a car photo to get your first report!</div>`;
        return;
      }
      window._historyData = data;
      historyList.innerHTML = '';
      data.forEach((item, idx) => {
        const detections = item.detections || [];
        const cp = item.combined_price || {};
        const fmtN = n => Number(n || 0).toLocaleString('en-IN');

        const detBadges = detections.map(d => `
          <span style="font-size:10px; padding:3px 9px; border-radius:20px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-weight:700; text-transform:capitalize;">${d.damage_type} — ${d.car_part}</span>
        `).join('');

        const priceRow = (cp.oem_total_estimate || cp.aftermarket_total_estimate) ? `
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:6px 12px; text-align:center;">
              <div style="font-size:9px; font-weight:700; color:#1d4ed8; text-transform:uppercase;">OEM Total</div>
              <div style="font-size:14px; font-weight:900; color:#1d4ed8;">₹${fmtN(cp.oem_total_estimate)}</div>
            </div>
            <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:6px 12px; text-align:center;">
              <div style="font-size:9px; font-weight:700; color:#16a34a; text-transform:uppercase;">Aftermarket</div>
              <div style="font-size:14px; font-weight:900; color:#15803d;">₹${fmtN(cp.aftermarket_total_estimate)}</div>
            </div>
          </div>` : (item.estimated_price ? `
          <div style="font-size:15px; font-weight:800; color:#ff7a1a; margin-top:8px;">Est: ₹${fmtN(item.estimated_price)}</div>` : '');

        const card = document.createElement('div');
        card.style.cssText = 'border:1px solid #e2e8f0; border-radius:14px; padding:16px; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.06); display:flex; flex-direction:column; gap:10px;';
        card.innerHTML = `
          <!-- Header Row -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
            <div style="flex:1;">
              <div style="font-size:15px; font-weight:800; color:#0f172a;">${item.car_brand || ''} ${item.car_model || ''} ${item.year ? '(' + item.year + ')' : ''}</div>
              <div style="font-size:12px; color:#64748b; margin-top:2px;">Variant: ${item.car_variant || 'N/A'} &nbsp;|&nbsp; Fuel: ${item.car_type || 'N/A'}</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${new Date(item.created_at).toLocaleString('en-IN')}</div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
              <span style="font-size:10px; padding:3px 10px; border-radius:20px; background:${detections.length > 0 ? '#fef2f2' : '#f0fdf4'}; color:${detections.length > 0 ? '#dc2626' : '#166534'}; font-weight:800; border:1px solid ${detections.length > 0 ? '#fecaca' : '#bbf7d0'}; white-space:nowrap;">
                ${detections.length > 0 ? '⚠ ' + detections.length + ' Damage' + (detections.length !== 1 ? 's' : '') : '✓ No Damage'}
              </span>
              <button onclick="downloadHistoryReport(${idx})" style="font-size:11px; font-weight:700; color:#fff; background:linear-gradient(135deg,#2563eb,#1d4ed8); border:none; border-radius:8px; padding:6px 14px; cursor:pointer; white-space:nowrap;">⬇ Download</button>
            </div>
          </div>

          <!-- AI Damage Message -->
          ${item.damage_message ? `<div style="font-size:12px; color:#475569; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; line-height:1.5;">${item.damage_message}</div>` : ''}

          <!-- Damage Badges -->
          ${detBadges ? `<div style="display:flex; flex-wrap:wrap; gap:5px;">${detBadges}</div>` : ''}

          <!-- Price Cards -->
          ${priceRow}

          <!-- Images + Links -->
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:2px;">
            ${item.s3_url ? `<a href="${item.s3_url}" target="_blank" style="font-size:11px; font-weight:600; color:#2563eb; text-decoration:none; padding:4px 10px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px;">📷 Original Photo</a>` : ''}
            ${item.s3_predicted_url ? `<a href="${item.s3_predicted_url}" target="_blank" style="font-size:11px; font-weight:600; color:#16a34a; text-decoration:none; padding:4px 10px; background:#f0fdf4; border:1px solid #86efac; border-radius:6px;">🎯 AI Analyzed Image</a>` : ''}
          </div>
        `;
        historyList.appendChild(card);
      });
    } catch (err) {
      historyList.innerHTML = `<p style="color:#ef4444; font-size:13px; padding:16px;">❌ Failed to load history: ${err.message}</p>`;
    }
  }
}

// ── Download History Report ───────────────────────────────
function downloadHistoryReport(idx) {
  const data = window._historyData;
  if (!data || !data[idx]) { alert('Report data not available.'); return; }
  const item = data[idx];
  const user = getStoredUser();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fmtN = n => Number(n || 0).toLocaleString('en-IN');
  const detections = item.detections || [];
  const cp = item.combined_price || {};

  // Images from S3
  const origImgHTML = item.s3_url
    ? `<div style="flex:1;text-align:center;"><div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Original Photo</div><img src="${item.s3_url}" style="width:100%;max-width:350px;border-radius:8px;border:2px solid #e2e8f0;" /></div>`
    : '';
  const aiImgHTML = item.s3_predicted_url
    ? `<div style="flex:1;text-align:center;"><div style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin-bottom:6px;">AI Analyzed Result</div><img src="${item.s3_predicted_url}" style="width:100%;max-width:350px;border-radius:8px;border:2px solid #3b82f6;" /></div>`
    : '';

  // Damage rows
  const dmgRows = detections.map((d, i) => `
    <tr style="background:${i%2===0?'#f8fafc':'#fff'}">
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;text-transform:capitalize;">${d.damage_type || ''}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${d.car_part || ''}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${d.confidence || ''}%</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${d.model_type || ''}</td>
    </tr>`).join('');

  // Price breakdown rows
  const priceRows = [
    ['OEM Parts Price',         cp.total_oem_part_price],
    ['Aftermarket Parts Price', cp.total_aftermarket_part_price],
    ['Labour Charges',          cp.total_damage_labour],
    ['Installation Charges',    cp.total_damage_installation],
    ['Paint Cost',              cp.total_damage_paint],
  ].filter(r => (r[1] || 0) > 0).map(([l, v], i) => `
    <tr style="background:${i%2===0?'#f8fafc':'#fff'}">
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${l}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;">₹${fmtN(v)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>RepairLensAI — Damage Report</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:Arial,sans-serif; color:#1e293b; background:#fff; padding:32px; font-size:13px; }
    @media print { body { padding:16px; } img { max-width:100% !important; } }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #3b82f6;">
    <div>
      <div style="font-size:22px;font-weight:900;color:#0f172a;">🔍 RepairLens <span style="color:#3b82f6;">AI</span></div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Car Damage Detection &amp; Repair Cost Estimation Report</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#64748b;">Generated on</div>
      <div style="font-size:13px;font-weight:700;">${dateStr} at ${timeStr}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Report ID: RL-${item.prediction_id || Date.now()}</div>
    </div>
  </div>

  <!-- Vehicle & User Details -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Vehicle &amp; Owner Details</div>
    <div style="display:flex;flex-wrap:wrap;gap:16px 32px;">
      ${[['Owner', user ? (user.name || user.email) : (item.user_name || '-')],
         ['Email', user ? user.email : '-'],
         ['Phone', user ? (user.phone || '-') : (item.user_phone || '-')],
         ['Brand', item.car_brand],
         ['Model', item.car_model],
         ['Variant', item.car_variant],
         ['Fuel Type', item.car_type],
         ['Year', item.year],
         ['File', item.filename],
         ['Analyzed On', new Date(item.created_at).toLocaleString('en-IN')],
        ].map(([k,v]) => `<div><span style="font-size:11px;color:#94a3b8;display:block;">${k}</span><span style="font-size:13px;font-weight:700;color:#0f172a;">${v||'-'}</span></div>`).join('')}
    </div>
  </div>

  <!-- Images -->
  ${origImgHTML || aiImgHTML ? `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;">${origImgHTML}${aiImgHTML}</div>` : ''}

  <!-- AI Assessment Summary -->
  <div style="margin-bottom:24px;">
    <h3 style="font-size:14px;font-weight:800;color:#1e293b;margin:0 0 8px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">🔍 AI Damage Assessment</h3>
    <p style="font-size:13px;color:#475569;line-height:1.6;">${item.damage_message || 'No assessment available.'}</p>
  </div>

  <!-- Detections Table -->
  ${detections.length > 0 ? `
  <div style="margin-bottom:24px;">
    <h3 style="font-size:14px;font-weight:800;color:#1e293b;margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">⚠ Detected Damages (${detections.length})</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#1e293b;color:#fff;">
          <th style="padding:9px 12px;border:1px solid #334155;text-align:left;">Damage Type</th>
          <th style="padding:9px 12px;border:1px solid #334155;text-align:left;">Car Part</th>
          <th style="padding:9px 12px;border:1px solid #334155;text-align:left;">Confidence</th>
          <th style="padding:9px 12px;border:1px solid #334155;text-align:left;">Model</th>
        </tr>
      </thead>
      <tbody>${dmgRows}</tbody>
    </table>
  </div>` : `
  <div style="padding:16px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;color:#16a34a;font-weight:700;margin-bottom:24px;">✅ No damage detected — vehicle appears to be in good condition.</div>`}

  <!-- Price Estimate -->
  ${(cp.oem_total_estimate || cp.aftermarket_total_estimate) ? `
  <div style="margin-bottom:24px;">
    <h3 style="font-size:14px;font-weight:800;color:#1e293b;margin:0 0 14px;padding-bottom:6px;border-bottom:2px solid #3b82f6;">💰 Repair Cost Estimate</h3>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:16px;">
      <div style="flex:1;min-width:180px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #3b82f6;border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:4px;">OEM Total Estimate</div>
        <div style="font-size:26px;font-weight:900;color:#1d4ed8;">₹${fmtN(cp.oem_total_estimate)}</div>
        <div style="font-size:11px;color:#64748b;margin-top:3px;">Subtotal ₹${fmtN(cp.oem_subtotal_before_gst)} + GST ₹${fmtN(cp.oem_gst_amount)}</div>
      </div>
      <div style="flex:1;min-width:180px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #22c55e;border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:4px;">Aftermarket Total</div>
        <div style="font-size:26px;font-weight:900;color:#15803d;">₹${fmtN(cp.aftermarket_total_estimate)}</div>
        <div style="font-size:11px;color:#64748b;margin-top:3px;">Subtotal ₹${fmtN(cp.aftermarket_subtotal_before_gst)} + GST ₹${fmtN(cp.aftermarket_gst_amount)}</div>
      </div>
    </div>
    ${priceRows ? `<table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#f1f5f9;"><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Cost Component</th><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;color:#475569;">Amount (₹)</th></tr></thead>
      <tbody>${priceRows}</tbody>
    </table>` : ''}
  </div>` : (item.estimated_price ? `
  <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #3b82f6;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">Estimated Repair Cost</div>
    <div style="font-size:28px;font-weight:900;color:#1d4ed8;">₹${fmtN(item.estimated_price)}</div>
  </div>` : '')}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;">
    <span>RepairLensAI — AI-Powered Car Damage &amp; Valuation Platform</span>
    <span>Report ID: RL-${item.prediction_id || Date.now()}</span>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 800);
}

function getApiBaseUrl() {
  const currentOrigin = window.location.origin || 'http://localhost:3001';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return currentOrigin;
  }
  return '';
}

async function parseApiResponseJson(res, defaultErrMsg = 'Request failed.') {
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
  } else {
    await res.text().catch(() => '');
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('Backend server is booting up or temporarily unreachable. Please wait 5-10 seconds and try again.');
    }
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}. Please try again.`);
    }
  }

  if (!res.ok) {
    let msg = (data && (data.detail || data.message || data.error)) || defaultErrMsg;
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    throw new Error(msg);
  }
  return data;
}

function navigateTo(pageId) {
  if (!PAGES.includes(pageId)) pageId = 'home';

  // If user is already logged in and tries to visit signin page, redirect to report
  if (pageId === 'signin' && getStoredUser()) {
    pageId = 'report';
  }

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

document.addEventListener('DOMContentLoaded', async () => {
  renderAuthState();
  refreshCurrentUser();

  // ── Direct Database Auth Handlers ───────────────────────
  const authTabSignin = document.getElementById('auth-tab-signin');
  const authTabSignup = document.getElementById('auth-tab-signup');
  const formSignin = document.getElementById('form-signin');
  const formSignup = document.getElementById('form-signup');
  const authMsg = document.getElementById('auth-msg');

  function showAuthMsg(msg, isError = true) {
    if (!authMsg) return;
    authMsg.textContent = msg;
    authMsg.style.display = 'block';
    authMsg.style.background = isError ? '#fef2f2' : '#f0fdf4';
    authMsg.style.color = isError ? '#991b1b' : '#166534';
    authMsg.style.border = isError ? '1px solid #fecaca' : '1px solid #bbf7d0';
  }

  if (authTabSignin && authTabSignup && formSignin && formSignup) {
    authTabSignin.addEventListener('click', () => {
      authTabSignin.style.background = '#fff';
      authTabSignin.style.color = '#0f172a';
      authTabSignup.style.background = 'transparent';
      authTabSignup.style.color = '#64748b';
      formSignin.style.display = 'block';
      formSignup.style.display = 'none';
      if (authMsg) authMsg.style.display = 'none';
    });

    authTabSignup.addEventListener('click', () => {
      authTabSignup.style.background = '#fff';
      authTabSignup.style.color = '#0f172a';
      authTabSignin.style.background = 'transparent';
      authTabSignin.style.color = '#64748b';
      formSignup.style.display = 'block';
      formSignin.style.display = 'none';
      if (authMsg) authMsg.style.display = 'none';
    });
  }

  if (formSignin) {
    formSignin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email')?.value.trim();
      const password = document.getElementById('signin-password')?.value.trim();
      const submitBtn = document.getElementById('signin-btn');
      if (!email || !password) return showAuthMsg('Please fill in both Email and Password.');

      try {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in...'; }
        const res = await fetch(`${getApiBaseUrl()}/api/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await parseApiResponseJson(res, 'Invalid email or password.');
        
        setStoredUser({ token: data.token, user: data.user });
        renderAuthState();
        showAuthMsg('Sign in successful! Redirecting...', false);
        setTimeout(() => navigateTo('report'), 500);
      } catch (err) {
        showAuthMsg(err.message || 'Invalid email or password.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In \u2192'; }
      }
    });
  }

  const signupEmailInput = document.getElementById('signup-email');
  const signupPhoneInput = document.getElementById('signup-phone');
  const signupEmailMsg   = document.getElementById('signup-email-msg');
  const signupPhoneMsg   = document.getElementById('signup-phone-msg');

  async function checkEmailAvailability() {
    const email = signupEmailInput?.value.trim();
    if (!email || !email.includes('@')) {
      if (signupEmailMsg) signupEmailMsg.style.display = 'none';
      if (signupEmailInput) signupEmailInput.style.borderColor = '#cbd5e1';
      return true;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/check-availability?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!data.email_available) {
        if (signupEmailMsg) {
          signupEmailMsg.style.display = 'block';
          signupEmailMsg.style.color = '#dc2626';
          signupEmailMsg.textContent = '⚠️ ' + (data.email_error || 'Email already exists. Please sign in.');
        }
        if (signupEmailInput) signupEmailInput.style.borderColor = '#dc2626';
        return false;
      } else {
        if (signupEmailMsg) {
          signupEmailMsg.style.display = 'block';
          signupEmailMsg.style.color = '#16a34a';
          signupEmailMsg.textContent = '✓ Email is available';
        }
        if (signupEmailInput) signupEmailInput.style.borderColor = '#16a34a';
        return true;
      }
    } catch (_) {
      return true;
    }
  }

  async function checkPhoneAvailability() {
    const phone = signupPhoneInput?.value.trim();
    const digits = (phone || '').replace(/\D/g, '');
    if (!phone || digits.length < 10) {
      if (signupPhoneMsg) signupPhoneMsg.style.display = 'none';
      if (signupPhoneInput) signupPhoneInput.style.borderColor = '#cbd5e1';
      return true;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/check-availability?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (!data.phone_available) {
        if (signupPhoneMsg) {
          signupPhoneMsg.style.display = 'block';
          signupPhoneMsg.style.color = '#dc2626';
          signupPhoneMsg.textContent = '⚠️ ' + (data.phone_error || 'Phone number already registered. Use a different number.');
        }
        if (signupPhoneInput) signupPhoneInput.style.borderColor = '#dc2626';
        return false;
      } else {
        if (signupPhoneMsg) {
          signupPhoneMsg.style.display = 'block';
          signupPhoneMsg.style.color = '#16a34a';
          signupPhoneMsg.textContent = '✓ Phone number is available';
        }
        if (signupPhoneInput) signupPhoneInput.style.borderColor = '#16a34a';
        return true;
      }
    } catch (_) {
      return true;
    }
  }

  if (signupEmailInput) {
    signupEmailInput.addEventListener('blur', checkEmailAvailability);
    signupEmailInput.addEventListener('input', () => {
      if (signupEmailMsg) signupEmailMsg.style.display = 'none';
      signupEmailInput.style.borderColor = '#cbd5e1';
    });
  }
  if (signupPhoneInput) {
    signupPhoneInput.addEventListener('blur', checkPhoneAvailability);
    signupPhoneInput.addEventListener('input', () => {
      if (signupPhoneMsg) signupPhoneMsg.style.display = 'none';
      signupPhoneInput.style.borderColor = '#cbd5e1';
    });
  }

  if (formSignup) {
    formSignup.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name')?.value.trim();
      const phone = document.getElementById('signup-phone')?.value.trim();
      const email = document.getElementById('signup-email')?.value.trim();
      const password = document.getElementById('signup-password')?.value.trim();
      const submitBtn = document.getElementById('signup-btn');
      if (!name || !phone || !email || !password) return showAuthMsg('Please fill in Name, Phone Number, Email, and Password.');

      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        return showAuthMsg('Please enter a valid 10-digit Phone Number.');
      }

      // Pre-check availability
      const [emailOk, phoneOk] = await Promise.all([checkEmailAvailability(), checkPhoneAvailability()]);
      if (!emailOk || !phoneOk) {
        return showAuthMsg('Please use a different Email or Phone number that is not already registered.');
      }

      try {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating account...'; }
        const res = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, password })
        });
        const data = await parseApiResponseJson(res, 'Account creation failed.');

        setStoredUser({ token: data.token, user: data.user });
        renderAuthState();
        showAuthMsg('Account created successfully! Redirecting...', false);
        setTimeout(() => navigateTo('report'), 500);
      } catch (err) {
        showAuthMsg(err.message || 'Account creation failed.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account \u2192'; }
      }
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      userLogout();
    });
  }

  const navUserBadge = document.getElementById('nav-user-badge');
  if (navUserBadge) {
    navUserBadge.style.cursor = 'pointer';
    navUserBadge.title = 'Click to open Dashboard & History';
    navUserBadge.addEventListener('click', (e) => {
      e.preventDefault();
      openDashboardModal();
    });
  }

  const navHistory = document.getElementById('nav-history');
  if (navHistory) {
    navHistory.addEventListener('click', (e) => {
      e.preventDefault();
      openDashboardModal();
    });
  }

  const closeDashBtn = document.getElementById('close-dashboard-btn');
  if (closeDashBtn) {
    closeDashBtn.addEventListener('click', () => {
      const modal = document.getElementById('dashboard-modal');
      if (modal) modal.style.display = 'none';
    });
  }

  // ── Forgot Password 3-Step Flow ──────────────────────────
  let _forgotEmail = '';
  let _forgotOtp   = '';

  const authTabsRow       = document.getElementById('auth-tabs-row');
  const panelForgotEmail  = document.getElementById('panel-forgot-email');
  const panelForgotOtp    = document.getElementById('panel-forgot-otp');
  const panelForgotNewpwd = document.getElementById('panel-forgot-newpwd');

  function showForgotStep(step) {
    // step: 'email' | 'otp' | 'newpwd' | null (back to signin)
    const allForgotPanels = [panelForgotEmail, panelForgotOtp, panelForgotNewpwd];
    allForgotPanels.forEach(p => { if (p) p.style.display = 'none'; });

    if (step === null) {
      // Back to normal signin
      if (authTabsRow)       authTabsRow.style.display = 'flex';
      if (formSignin)        formSignin.style.display  = 'block';
      if (formSignup)        formSignup.style.display  = 'none';
      const title    = document.getElementById('auth-header-title');
      const subtitle = document.getElementById('auth-header-subtitle');
      if (title)    title.textContent    = 'Welcome to RepairLensAI';
      if (subtitle) subtitle.textContent = 'Sign in or create an account to start estimating car damage';
      if (authTabSignin) { authTabSignin.style.background = '#fff'; authTabSignin.style.color = '#0f172a'; }
      if (authTabSignup) { authTabSignup.style.background = 'transparent'; authTabSignup.style.color = '#64748b'; }
      if (authMsg) authMsg.style.display = 'none';
      return;
    }

    // Hide tabs & normal forms
    if (authTabsRow) authTabsRow.style.display = 'none';
    if (formSignin)  formSignin.style.display   = 'none';
    if (formSignup)  formSignup.style.display   = 'none';
    if (authMsg)     authMsg.style.display       = 'none';

    const titleEl    = document.getElementById('auth-header-title');
    const subtitleEl = document.getElementById('auth-header-subtitle');

    if (step === 'email') {
      if (panelForgotEmail) panelForgotEmail.style.display = 'block';
      if (titleEl)    titleEl.textContent    = 'Forgot Password';
      if (subtitleEl) subtitleEl.textContent = 'Reset your password via OTP';
    } else if (step === 'otp') {
      if (panelForgotOtp) panelForgotOtp.style.display = 'block';
      const sentEl = document.getElementById('otp-sent-email');
      if (sentEl) sentEl.textContent = _forgotEmail;
      if (titleEl)    titleEl.textContent    = 'Enter OTP';
      if (subtitleEl) subtitleEl.textContent = 'Check your email for the 6-digit code';
    } else if (step === 'newpwd') {
      if (panelForgotNewpwd) panelForgotNewpwd.style.display = 'block';
      if (titleEl)    titleEl.textContent    = 'Create New Password';
      if (subtitleEl) subtitleEl.textContent = 'Choose a strong password for your account';
    }
  }

  // "Forgot password?" link → Step 1
  const forgotLink = document.getElementById('forgot-password-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      const emailVal = document.getElementById('signin-email')?.value.trim();
      if (emailVal) {
        const forgotInput = document.getElementById('forgot-email-input');
        if (forgotInput) forgotInput.value = emailVal;
      }
      showForgotStep('email');
    });
  }

  // Back to Sign In link
  const backToSigninLink = document.getElementById('back-to-signin-link');
  if (backToSigninLink) {
    backToSigninLink.addEventListener('click', (e) => { e.preventDefault(); showForgotStep(null); });
  }

  // Back to Email step
  const backToEmailLink = document.getElementById('back-to-email-link');
  if (backToEmailLink) {
    backToEmailLink.addEventListener('click', (e) => { e.preventDefault(); showForgotStep('email'); });
  }

  // Auth tab clicks should also exit forgot-password mode
  if (authTabSignin) {
    authTabSignin.addEventListener('click', () => {
      authTabsRow && (authTabsRow.style.display = 'flex');
      authTabSignin.style.background = '#fff';     authTabSignin.style.color = '#0f172a';
      authTabSignup.style.background = 'transparent'; authTabSignup.style.color = '#64748b';
      if (formSignin) formSignin.style.display = 'block';
      if (formSignup) formSignup.style.display = 'none';
      [panelForgotEmail, panelForgotOtp, panelForgotNewpwd].forEach(p => { if (p) p.style.display = 'none'; });
      if (authMsg) authMsg.style.display = 'none';
    });
  }
  if (authTabSignup) {
    authTabSignup.addEventListener('click', () => {
      authTabsRow && (authTabsRow.style.display = 'flex');
      authTabSignup.style.background = '#fff';     authTabSignup.style.color = '#0f172a';
      authTabSignin.style.background = 'transparent'; authTabSignin.style.color = '#64748b';
      if (formSignup) formSignup.style.display = 'block';
      if (formSignin) formSignin.style.display = 'none';
      [panelForgotEmail, panelForgotOtp, panelForgotNewpwd].forEach(p => { if (p) p.style.display = 'none'; });
      if (authMsg) authMsg.style.display = 'none';
    });
  }

  // STEP 1: Send OTP
  const sendOtpBtn = document.getElementById('send-otp-btn');
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async () => {
      const email = document.getElementById('forgot-email-input')?.value.trim();
      if (!email) return showAuthMsg('Please enter your email address.');
      _forgotEmail = email;
      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = 'Sending OTP...';
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await parseApiResponseJson(res, 'Failed to send OTP.');
        showForgotStep('otp');
        showAuthMsg('OTP sent! Check your email inbox (and spam folder).', false);
      } catch (err) {
        showAuthMsg(err.message || 'Failed to send OTP. Please try again.');
      } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP →';
      }
    });
  }

  // Resend OTP
  const resendOtpLink = document.getElementById('resend-otp-link');
  if (resendOtpLink) {
    resendOtpLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!_forgotEmail) return;
      resendOtpLink.textContent = 'Sending...';
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: _forgotEmail })
        });
        await parseApiResponseJson(res, 'Failed to resend OTP.');
        showAuthMsg('New OTP sent! Check your email.', false);
      } catch (err) {
        showAuthMsg(err.message || 'Failed to resend OTP.');
      } finally {
        resendOtpLink.textContent = 'Resend OTP';
      }
    });
  }

  // STEP 2: Verify OTP
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', async () => {
      const otp = document.getElementById('otp-input')?.value.trim();
      if (!otp || otp.length !== 6) return showAuthMsg('Please enter the 6-digit OTP.');
      _forgotOtp = otp;
      verifyOtpBtn.disabled = true;
      verifyOtpBtn.textContent = 'Verifying...';
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: _forgotEmail, otp })
        });
        const data = await parseApiResponseJson(res, 'OTP verification failed.');
        showForgotStep('newpwd');
        if (authMsg) authMsg.style.display = 'none';
      } catch (err) {
        showAuthMsg(err.message || 'Invalid OTP. Please try again.');
      } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify OTP →';
      }
    });
  }

  // STEP 3: Reset Password
  const resetPwdBtn = document.getElementById('reset-password-btn');
  if (resetPwdBtn) {
    resetPwdBtn.addEventListener('click', async () => {
      const newPwd     = document.getElementById('new-password-input')?.value.trim();
      const confirmPwd = document.getElementById('confirm-password-input')?.value.trim();
      if (!newPwd || newPwd.length < 6) return showAuthMsg('Password must be at least 6 characters.');
      if (newPwd !== confirmPwd)          return showAuthMsg('Passwords do not match. Please re-enter.');
      resetPwdBtn.disabled = true;
      resetPwdBtn.textContent = 'Resetting...';
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: _forgotEmail, otp: _forgotOtp, new_password: newPwd })
        });
        const data = await parseApiResponseJson(res, 'Password reset failed.');
        // Success — go back to sign in
        showForgotStep(null);
        showAuthMsg('Password reset successfully! Please sign in with your new password. 🎉', false);
        _forgotEmail = '';
        _forgotOtp   = '';
        // Pre-fill email
        const signinEmailEl = document.getElementById('signin-email');
        if (signinEmailEl) signinEmailEl.value = _forgotEmail || '';
      } catch (err) {
        showAuthMsg(err.message || 'Password reset failed. Please try again.');
      } finally {
        resetPwdBtn.disabled = false;
        resetPwdBtn.textContent = 'Reset Password →';
      }
    });
  }


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

  const fileInput = document.getElementById('car-image');
  const imageFiles = fileInput ? fileInput.files : [];

  if (!imageFiles || imageFiles.length === 0) {
    alert('Please upload a car photo before analysis.');
    return;
  }
  if (imageFiles.length > 1) {
    alert('Please upload only 1 car photo at a time.');
    return;
  }

  const selectedFile = imageFiles[0];
  if (!selectedFile.type.startsWith('image/')) {
    alert('Only image files are allowed.');
    return;
  }
  if (selectedFile.size > 10 * 1024 * 1024) {
    alert('Please upload an image smaller than 10 MB.');
    return;
  }

  const currentUser = getStoredUser();
  if (!currentUser) {
    alert('Please sign in or sign up before running a damage analysis.');
    navigateTo('signin');
    return;
  }


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

    const session = getAuthSession();
    const response = await fetch(`${getApiBaseUrl()}/api/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: formData
    });
    
    const contentType = response.headers.get('content-type') || '';
    let data = {};
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      throw new Error(`Server returned HTML/non-JSON response (${response.status}): ${rawText.slice(0, 120)}`);
    }

    if (response.ok && data.success) {
      await refreshCurrentUser();
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
      let errorMsg = data.analysis_message || data.detail || 'Unknown error';
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
    <span style="font-size:11px; padding:5px 12px; border-radius:20px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
      <strong style="text-transform:capitalize;">${d.damage_type}</strong> &nbsp;—&nbsp; ${d.car_part}
    </span>
  `).join("");

  const box = document.createElement("div");
  box.className = "combined-price-card";
  box.style.cssText = "background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.04); display:flex; flex-direction:column; gap:18px;";
  box.innerHTML = `
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid #e2e8f0; padding-bottom:16px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
          🧮
        </div>
        <div>
          <h4 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 2px 0;letter-spacing:0.01em;">TOTAL DAMAGE REPAIR ESTIMATE</h4>
          <p style="font-size:12px;color:#475569;margin:0;font-weight:500;">${detections.length} damage${detections.length!==1?'s':''} detected &nbsp;·&nbsp; GST ${gstPct}% applied</p>
        </div>
      </div>
      ${savings > 0 ? `
      <span style="font-size:12px;font-weight:800;padding:7px 16px;border-radius:20px;background:#dcfce7;color:#15803d;border:1px solid #86efac;">
        💰 Aftermarket saves ₹${fmt(savings)}
      </span>` : ''}
    </div>

    <!-- Big Totals -->
    <div class="price-totals-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
      <div style="background:#f0f7ff;border:1.5px solid #93c5fd;border-radius:14px;padding:18px;text-align:center;">
        <div style="font-size:11px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:0.06em;">OEM Total Estimate</div>
        <div style="font-size:28px;font-weight:900;color:#1d4ed8;margin:6px 0 2px;">₹${fmt(cp.oem_total_estimate)}</div>
        <div style="font-size:11px;color:#475569;font-weight:500;">Subtotal ₹${fmt(cp.oem_subtotal_before_gst)} + GST ₹${fmt(cp.oem_gst_amount)}</div>
      </div>
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;padding:18px;text-align:center;">
        <div style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:0.06em;">Aftermarket Total</div>
        <div style="font-size:28px;font-weight:900;color:#15803d;margin:6px 0 2px;">₹${fmt(cp.aftermarket_total_estimate)}</div>
        <div style="font-size:11px;color:#475569;font-weight:500;">Subtotal ₹${fmt(cp.aftermarket_subtotal_before_gst)} + GST ₹${fmt(cp.aftermarket_gst_amount)}</div>
      </div>
    </div>

    <!-- Itemised Breakdown -->
    <div style="background:#f8fafc;border-radius:12px;padding:18px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:14px;">
        Itemised Cost Breakdown
      </div>
      <div class="price-itemised-grid" style="font-size:13px; display:flex; flex-direction:column; gap:8px;">
        ${[
          ['OEM Parts Price',        cp.total_oem_part_price,        '#1d4ed8'],
          ['Aftermarket Parts Price', cp.total_aftermarket_part_price, '#15803d'],
          ['Labour Charges',          cp.total_damage_labour,          '#b45309'],
          ['Installation Charges',    cp.total_damage_installation,    '#b45309'],
          ['Paint Cost',              cp.total_damage_paint,           '#c2410c'],
        ].filter(r => (r[1] || 0) > 0).map(([label, val, col]) => `
          <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed #e2e8f0;">
            <span style="color:#475569;font-weight:600;">${label}:</span>
            <span style="color:${col};font-weight:800;">₹${fmt(val)}</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed #e2e8f0;">
          <span style="color:#475569;font-weight:600;">Repair Items:</span>
          <span style="color:#4338ca;font-weight:800;">${cp.repair_item_count}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed #e2e8f0;">
          <span style="color:#475569;font-weight:600;">Replacement Items:</span>
          <span style="color:#dc2626;font-weight:800;">${cp.replacement_item_count}</span>
        </div>
      </div>
    </div>

    <!-- Damage Badges -->
    <div>
      <div style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;font-weight:700;">Damages Included:</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">${damageBadgesHTML}</div>
    </div>

    <!-- Estimate Disclaimer Notice -->
    <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px 16px; margin-top:6px; display:flex; align-items:center; gap:12px; font-size:13px; color:#92400e; line-height:1.5;">
      <span style="font-size:20px; flex-shrink:0;">⚠️</span>
      <div><strong style="color:#78350f;">Notice:</strong> This is an estimate price (varies 15–20%). Final repair cost may vary based on garage labor rates and local spare parts availability.</div>
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
        <p style="color:#dc2626; font-weight:600;">${res.analysis_message}</p>
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
        <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:0 0 4px 0;">Car Photo: ${res.filename}</h3>
        <p style="font-size:13px; color:#475569; margin:0;">${detections.length} damage issue${detections.length !== 1 ? 's' : ''} detected by AI models</p>
      </div>
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span style="font-size:12px; padding:6px 16px; border-radius:20px; background:${detections.length > 0 ? '#fef2f2' : '#f0fdf4'}; color:${detections.length > 0 ? '#dc2626' : '#166534'}; font-weight:800; border:1px solid ${detections.length > 0 ? '#fecaca' : '#bbf7d0'};">
          ${detections.length > 0 ? `⚠ ${detections.length} Damage${detections.length !== 1 ? 's' : ''} Found` : '✓ No Damage Detected'}
        </span>
      </div>
    `;
    card.appendChild(header);

    // ── Classification Model Badge ──────────────────
    const pytorchModelsSection = document.createElement("div");
    pytorchModelsSection.style.cssText = "display:flex; gap:12px; flex-wrap:wrap; margin:14px 0 18px 0;";
    pytorchModelsSection.innerHTML = `
      <div style="flex:1; min-width:220px; background:#fff1f2; border:1px solid #fecdd3; border-radius:12px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-size:10px; font-weight:700; color:#9f1239; text-transform:uppercase; letter-spacing:0.04em;">Damage Assessment</div>
          <div style="font-size:14px; font-weight:800; color:#e11d48; margin-top:2px;">${res.car_damage_classifier ? res.car_damage_classifier.status : 'Car Damage Identified'}</div>
        </div>
        <span style="font-size:22px;">🔍</span>
      </div>
    `;
    card.appendChild(pytorchModelsSection);

    // ── Side by Side Images ──────────────────────────────────
    const imageGrid = document.createElement("div");
    imageGrid.className = "result-images-grid";

    const imgPanels = [
      { src: res.original_b64, label: 'Original Car Image', badge: 'Uploaded', accentColor: '#f1f5f9', textColor: '#475569', borderColor: '#cbd5e1' },
      { src: res.combined_b64 || res.original_b64, label: 'AI Analyzed Result', badge: 'AI Detected', accentColor: '#fff7ed', textColor: '#c2410c', borderColor: '#fdba74' }
    ];

    imgPanels.forEach(p => {
      const panel = document.createElement("div");
      panel.style.cssText = "display:flex; flex-direction:column; gap:10px;";
      panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:11px; font-weight:700; color:${p.textColor}; text-transform:uppercase; letter-spacing:0.07em;">${p.label}</span>
          <span style="font-size:10px; padding:3px 9px; border-radius:4px; background:${p.accentColor}; color:${p.textColor}; font-weight:700; border:1px solid ${p.borderColor};">${p.badge}</span>
        </div>
        <img src="${p.src}" style="width:100%; border-radius:12px; border:1px solid ${p.borderColor}; object-fit:cover; box-shadow:0 4px 16px rgba(0,0,0,0.06);" />
      `;
      imageGrid.appendChild(panel);
    });
    card.appendChild(imageGrid);

    // ── Dashboard: Damage & Price Breakdown ─────────────────
    const dashSection = document.createElement("div");
    dashSection.style.cssText = "display:flex; flex-direction:column; gap:16px;";

    const dashHeader = document.createElement("div");
    dashHeader.style.cssText = "display:flex; align-items:center; gap:10px; padding-bottom:12px; border-bottom:1px solid #e2e8f0;";
    dashHeader.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span style="font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.06em;">Damage & Price Breakdown</span>
    `;
    dashSection.appendChild(dashHeader);

    if (detections.length === 0) {
      dashSection.innerHTML += `
        <div style="text-align:center; padding:32px; border:1px dashed #cbd5e1; border-radius:12px; color:#475569;">
          <div style="font-size:32px; margin-bottom:8px;">✅</div>
          <p style="margin:0; font-size:14px; font-weight:700; color:#16a34a;">No structural damage detected</p>
          <p style="margin:4px 0 0; font-size:12px; color:#64748b;">This vehicle appears to be in good condition.</p>
        </div>
      `;
    } else {
      // Render the single combined price card from backend price.keras result
      const combinedCard = createCombinedPriceCard(res.combined_price, detections);
      if (combinedCard) dashSection.appendChild(combinedCard);

      // 2. Render Header for Individual Damage Breakdown Cards
      const indLabel = document.createElement("div");
      indLabel.style.cssText = "font-size:12px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.06em; margin-top:8px;";
      indLabel.textContent = "Individual Damage Breakdown Items";
      dashSection.appendChild(indLabel);

      const colGrid = document.createElement("div");
      colGrid.className = "damage-cards-grid";

      const damageColors = {
        'dent': { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', icon: '🔨' },
        'scratch': { bg: '#fefce8', border: '#fef08a', text: '#a16207', icon: '✂️' },
        'crack': { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', icon: '⚡' },
        'glass shatter': { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', icon: '💎' },
        'lamp broken': { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: '💡' },
        'tire flat': { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', icon: '🛞' },
      };

      detections.forEach(d => {
        const col = damageColors[d.damage_type] || { bg: '#f8fafc', border: '#cbd5e1', text: '#334155', icon: '⚠️' };
        const confBarWidth = Math.min(100, d.confidence);
        const confBarColor = d.confidence >= 70 ? '#dc2626' : d.confidence >= 40 ? '#ea580c' : '#ca8a04';

        const dmgCard = document.createElement("div");
        dmgCard.style.cssText = `
          background: ${col.bg};
          border: 1.5px solid ${col.border};
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
              <span style="font-size:10px; padding:2px 8px; border-radius:8px; background:#e2e8f0; color:#334155; font-weight:700;">${d.model_type === 'Segmentation Model' ? 'SEG' : 'DET'}</span>
            </div>
          </div>
          <div>
            <div style="font-size:16px; font-weight:900; color:${col.text}; text-transform:capitalize; margin-bottom:6px;">${d.damage_type}</div>
            <div style="font-size:12px; color:#475569; font-weight:600;">
              Part: <span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:6px; font-weight:700; border:1px solid #bae6fd;">${d.car_part}</span>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
              <span style="font-size:11px; color:#475569; text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">AI Confidence</span>
              <span style="font-size:11px; font-weight:800; color:${confBarColor};">${d.confidence}%</span>
            </div>
            <div style="background:#e2e8f0; border-radius:4px; height:6px; overflow:hidden;">
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

const downloadPdfBtn = document.getElementById("download-pdf-btn");
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
let _reportCouponCode = '';

function openCheckoutModal(planName, priceAmount, couponCode = '') {
  _checkoutState = {
    planName: planName,
    origPrice: priceAmount,
    discountAmount: 0,
    finalPrice: priceAmount,
    couponCode: couponCode
  };

  const modal = document.getElementById('checkout-modal');
  const planNameEl = document.getElementById('modal-plan-name');
  const origPriceEl = document.getElementById('modal-orig-price');
  const discountRow = document.getElementById('modal-discount-row');
  const finalPriceEl = document.getElementById('modal-final-price');
  const couponInput = document.getElementById('coupon-code-input');
  const couponMsg = document.getElementById('coupon-msg');
  const proceedButton = document.getElementById('proceed-razorpay-btn');
  const guestBox = document.getElementById('checkout-guest-box');

  if (planNameEl) planNameEl.textContent = planName;
  if (origPriceEl) origPriceEl.textContent = '₹' + priceAmount.toLocaleString('en-IN');
  if (finalPriceEl) finalPriceEl.textContent = '₹' + priceAmount.toLocaleString('en-IN');
  if (discountRow) discountRow.style.display = 'none';
  if (couponInput) couponInput.value = couponCode;
  if (couponMsg) { couponMsg.style.display = 'none'; couponMsg.textContent = ''; }
  if (proceedButton) proceedButton.disabled = false;

  // Toggle guest details box if not logged in
  const currentUser = getStoredUser();
  if (guestBox) {
    guestBox.style.display = currentUser ? 'none' : 'block';
  }

  if (modal) modal.style.display = 'flex';
  if (couponCode) handleApplyCoupon(couponCode);
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
  const applyButton = document.getElementById('apply-coupon-btn');
  const proceedButton = document.getElementById('proceed-razorpay-btn');

  if (!code) {
    if (couponMsg) {
      couponMsg.style.display = 'block';
      couponMsg.style.color = '#ef4444';
      couponMsg.textContent = 'Please enter a coupon code.';
    }
    return;
  }

  if (applyButton) applyButton.disabled = true;
  if (proceedButton) proceedButton.disabled = true;
  try {
    const data = await apiRequest('/api/apply-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_code: code, amount: _checkoutState.origPrice, plan_name: _checkoutState.planName })
    });

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
    _checkoutState.discountAmount = 0;
    _checkoutState.finalPrice = _checkoutState.origPrice;
    _checkoutState.couponCode = '';
    if (discountRow) discountRow.style.display = 'none';
    if (finalPriceEl) finalPriceEl.textContent = '₹' + _checkoutState.origPrice.toLocaleString('en-IN');
    if (couponMsg) {
      couponMsg.style.display = 'block';
      couponMsg.style.color = '#ef4444';
      couponMsg.textContent = e.message || 'Coupon validation failed.';
    }
  } finally {
    if (applyButton) applyButton.disabled = false;
    if (proceedButton) proceedButton.disabled = false;
  }
}

async function initRazorpayPayment(planName, finalPrice, couponCode) {
  let user = getStoredUser();

  // If user is not logged in, handle guest auto-signup from checkout modal
  if (!user) {
    const name = document.getElementById('checkout-guest-name')?.value.trim();
    const phone = document.getElementById('checkout-guest-phone')?.value.trim();
    const email = document.getElementById('checkout-guest-email')?.value.trim();
    const password = document.getElementById('checkout-guest-password')?.value.trim();

    if (!email || !password || !name || !phone) {
      alert('Please fill in your Full Name, Phone, Email, and Password in the checkout box to complete your purchase.');
      return;
    }

    try {
      // Attempt Sign Up first
      const signupRes = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password })
      });
      let signupData = null;
      try {
        signupData = await parseApiResponseJson(signupRes, 'Account setup failed.');
      } catch (e) {
        signupData = { detail: e.message };
      }
      
      if (signupRes.ok && signupData && signupData.token) {
        setStoredUser({ token: signupData.token, user: signupData.user });
        user = signupData.user;
      } else if (signupData && signupData.detail && signupData.detail.includes('already exists')) {
        // Attempt Sign In if already registered
        const signinRes = await fetch(`${getApiBaseUrl()}/api/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const signinData = await parseApiResponseJson(signinRes, 'Sign in failed.');
        if (signinRes.ok && signinData.token) {
          setStoredUser({ token: signinData.token, user: signinData.user });
          user = signinData.user;
        } else {
          throw new Error(signinData.detail || 'Sign in failed.');
        }
      } else {
        throw new Error((signupData && signupData.detail) || 'Account setup failed.');
      }
      renderAuthState();
    } catch (err) {
      alert('Account setup error: ' + (err.message || 'Please check your details.'));
      return;
    }
  }

  if (!window.Razorpay) {
    alert('Razorpay Checkout SDK could not be loaded. Please check your internet connection.');
    return;
  }

  try {
    const data = await apiRequest('/api/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_name: planName, coupon_code: couponCode || null })
    });
    const orderId = data.order_id;

    const options = {
      key: data.key_id,
      amount: data.payment_type === 'order' ? data.amount : undefined,
      currency: "INR",
      name: "Dateai",
      description: planName + (couponCode ? ` (Coupon: ${couponCode})` : ''),
      notes: {
        plan: planName,
        coupon: couponCode || "None"
      },
      prefill: {
        email: user.email,
        name: user.name || '',
        contact: user.phone || ''
      },
      theme: {
        color: "#E8622A"
      },
      handler: async function (response) {
        try {
          await apiRequest('/api/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || null,
              razorpay_subscription_id: response.razorpay_subscription_id || null,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const updatedUser = await refreshCurrentUser();
          const paymentRef = response.razorpay_subscription_id || response.razorpay_order_id;
          showRazorpaySuccessModal(planName, data.final_price_rupees, paymentRef, response.razorpay_payment_id, updatedUser?.report_credits);
        } catch (error) {
          alert(`Payment was received but could not be verified: ${error.message}. Contact support before retrying.`);
        }
      },
      modal: {
        ondismiss: function() {
          console.log('Razorpay modal closed');
        }
      }
    };

    if (data.payment_type === 'subscription') options.subscription_id = data.subscription_id;
    else options.order_id = orderId;

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      alert('Payment failed: ' + (response.error.description || 'Transaction declined'));
    });
    rzp.open();
  } catch (error) {
    alert(error.message || 'Could not start Razorpay checkout.');
  }
}

function showRazorpaySuccessModal(planName, priceAmount, orderId, paymentId, credits) {
  const modal = document.getElementById('razorpay-success-modal');
  const planEl = document.getElementById('rzp-receipt-plan');
  const amountEl = document.getElementById('rzp-receipt-amount');
  const orderEl = document.getElementById('rzp-receipt-order');
  const paymentEl = document.getElementById('rzp-receipt-payment');

  if (planEl) planEl.textContent = planName + (_checkoutState.couponCode ? ` (Coupon: ${_checkoutState.couponCode})` : '');
  if (amountEl) amountEl.textContent = '₹' + priceAmount.toLocaleString('en-IN');
  if (orderEl) orderEl.textContent = orderId;
  if (paymentEl) paymentEl.textContent = paymentId;
  const creditsEl = document.getElementById('rzp-receipt-credits');
  if (creditsEl) creditsEl.textContent = credits ?? '-';

  if (modal) {
    modal.style.display = 'flex';
  }
}

// Wire Razorpay & Checkout event listeners
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.razorpay-btn');
  if (btn) {
    e.preventDefault();
    const plan = btn.dataset.plan || 'RepairLensAI Plan';
    const price = parseInt(btn.dataset.price || '29', 10);
    const reportCoupon = btn.id === 'report-pay-btn' ? _reportCouponCode : '';
    openCheckoutModal(plan, price, reportCoupon);
  }

  if (e.target.id === 'close-checkout-modal') {
    closeCheckoutModal();
  }

  if (e.target.id === 'apply-coupon-btn') {
    const val = document.getElementById('coupon-code-input')?.value;
    handleApplyCoupon(val);
  }

  if (e.target.id === 'report-apply-coupon-btn' || e.target.closest('#report-apply-coupon-btn')) {
    const val = (document.getElementById('report-coupon-input')?.value || '').trim().toUpperCase();
    const msg = document.getElementById('report-coupon-msg');
    if (!val) {
      if (msg) { msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.textContent = 'Please enter a coupon code.'; }
      return;
    }

    try {
      const data = await apiRequest('/api/apply-coupon', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: val, amount: 29, plan_name: 'Report Credit Token' })
      });
      if (!data.valid) throw new Error(data.message);
      _reportCouponCode = data.code;
      if (data.final_amount === 0) {
        await apiRequest('/api/redeem-report-coupon', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon_code: val, amount: 29, plan_name: 'Report Credit Token' })
        });
        await refreshCurrentUser();
        _reportCouponCode = '';
        if (msg) {
          msg.style.display = 'block';
          msg.style.color = '#16a34a';
          msg.textContent = 'Free report activated. You can analyse your uploaded photo now.';
        }
      } else if (msg) {
        msg.style.display = 'block';
        msg.style.color = '#16a34a';
        msg.textContent = `${data.message} Continue to checkout to pay ₹${data.final_amount}.`;
      }
    } catch (error) {
      _reportCouponCode = '';
      if (msg) {
        msg.style.display = 'block';
        msg.style.color = '#ef4444';
        msg.textContent = error.message || 'Coupon validation failed.';
      }
    }
  }

  const couponTag = e.target.closest('.quick-coupon-tag');
  if (couponTag) {
    const code = couponTag.dataset.code;
    if (couponTag.closest('#checkout-modal')) {
      const input = document.getElementById('coupon-code-input');
      if (input) input.value = code;
      handleApplyCoupon(code);
    } else {
      const reportInput = document.getElementById('report-coupon-input');
      if (reportInput) reportInput.value = code;
      const msg = document.getElementById('report-coupon-msg');
      if (msg) {
        msg.style.display = 'block';
        msg.style.color = '#475569';
        msg.textContent = 'Coupon selected. Click Apply to confirm.';
      }
    }
  }

  if (e.target.id === 'proceed-razorpay-btn' || e.target.closest('#proceed-razorpay-btn')) {
    closeCheckoutModal();
    initRazorpayPayment(_checkoutState.planName, _checkoutState.finalPrice, _checkoutState.couponCode);
  }

  if (e.target.id === 'rzp-close-modal-btn') {
    const modal = document.getElementById('razorpay-success-modal');
    if (modal) modal.style.display = 'none';
    if (typeof navigateTo === 'function') navigateTo('report');
  }
});


