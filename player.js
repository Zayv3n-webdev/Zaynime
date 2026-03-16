/* ============================================================
   player.js — Zaynime Video Player
   ============================================================ */

const Player = (() => {

  let currentEpData   = null;
  let currentEpTitle  = '';
  let currentServers  = [];

  function open(epSlug, epTitle) {
    if (!epSlug) { UI.toast('Slug episode tidak ditemukan', 'error'); return; }

    currentEpTitle = epTitle;
    document.getElementById('player-ep-title').textContent = epTitle;

    const modal = document.getElementById('player-modal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    const frame = document.getElementById('iframe-wrap');
    frame.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9090b8">⏳ Memuat episode...</div>';

    // Reset selects
    document.getElementById('res-select').innerHTML    = '<option value="">Resolusi...</option>';
    document.getElementById('server-select').innerHTML = '<option value="">Server...</option>';

    API.episode(epSlug).then(data => {
      if (!data) {
        frame.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9090b8;flex-direction:column;gap:12px"><div style="font-size:2.5rem">😢</div><p>Gagal memuat video. Coba episode lain.</p></div>';
        return;
      }

      currentEpData = data;

      // --- Streaming URL ---
      const streamUrl = data.defaultStreamingUrl || data.streamUrl
                     || data.stream_url           || data.url || '';

      // --- Server list ---
      const rawServers = data.streamingLink || data.mirror || data.server || data.sources || [];
      currentServers = Array.isArray(rawServers) ? rawServers : [];

      if (currentServers.length) {
        const sel = document.getElementById('server-select');
        sel.innerHTML = currentServers.map((s, i) => {
          const label = s.server || s.name || `Server ${i + 1}`;
          const qual  = s.quality || s.resolution || '';
          return `<option value="${i}">${label}${qual ? ' · ' + qual : ''}</option>`;
        }).join('');

        // Load first server
        loadServer(0);
      } else if (streamUrl) {
        frame.innerHTML = `<iframe src="${streamUrl}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
      } else {
        frame.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9090b8;flex-direction:column;gap:12px;padding:1rem;text-align:center"><div style="font-size:2.5rem">📺</div><p>Tidak ada stream langsung.<br>Gunakan tombol Download untuk menonton offline.</p><button class="btn btn-accent btn-sm" onclick="Player.openDownload()">⬇ Download Episode</button></div>';
      }

      // --- Download resolutions ---
      const dlData = data.downloadLink || data.download || data.downloads || [];
      buildResSelect(dlData);
    });
  }

  function loadServer(idx) {
    if (!currentServers[idx]) return;
    const s   = currentServers[idx];
    const url = s.url || s.src || s.streamUrl || '';
    const frame = document.getElementById('iframe-wrap');

    if (url) {
      frame.innerHTML = `<iframe src="${url}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
    } else {
      frame.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9090b8"><p>Server ini tidak tersedia.</p></div>';
    }
  }

  function changeServer() {
    const idx = parseInt(document.getElementById('server-select').value);
    if (!isNaN(idx)) loadServer(idx);
  }

  function buildResSelect(dlData) {
    const sel = document.getElementById('res-select');
    if (!dlData || !dlData.length) {
      sel.innerHTML = '<option value="">—</option>';
      return;
    }
    // Flatten resolutions from downloadLink structure
    const resOptions = [];
    dlData.forEach(group => {
      const res   = group.resolution || group.quality || group.reso || '';
      const links = group.links || group.url
                    ? (group.links || [{ url: group.url, server: group.server || '—' }])
                    : [];
      links.forEach(l => {
        resOptions.push({ label: `${res} — ${l.server || '—'}`, url: l.url || l.src || '' });
      });
    });
    sel.innerHTML = resOptions.map((o, i) => `<option value="${i}">${o.label}</option>`).join('');
    sel._options = resOptions;
  }

  function changeRes() {
    const sel = document.getElementById('res-select');
    const idx = parseInt(sel.value);
    const opts = sel._options;
    if (opts && opts[idx] && opts[idx].url) {
      UI.toast(`Resolusi diubah: ${opts[idx].label}`, 'info');
      document.getElementById('iframe-wrap').innerHTML =
        `<iframe src="${opts[idx].url}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
    }
  }

  function openDownload() {
    if (!currentEpData) { UI.toast('Data download tidak tersedia', 'error'); return; }
    Download.open(currentEpTitle, currentEpData.downloadLink || currentEpData.download || []);
  }

  function copyLink() {
    const iframe = document.querySelector('#iframe-wrap iframe');
    if (iframe) {
      navigator.clipboard.writeText(iframe.src).then(() => UI.toast('Link stream disalin!', 'success'));
    } else {
      UI.toast('Tidak ada link untuk disalin', 'error');
    }
  }

  function close() {
    document.getElementById('player-modal').classList.remove('open');
    document.getElementById('iframe-wrap').innerHTML = '';
    document.body.style.overflow = '';
    currentEpData  = null;
    currentServers = [];
  }

  return { open, close, changeServer, changeRes, openDownload, copyLink };
})();
