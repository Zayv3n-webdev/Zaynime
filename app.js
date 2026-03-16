/* ============================================================
   app.js — Zaynime Main Application
   ============================================================ */

const App = (() => {

  /* ---- state ---- */
  let currentPage     = 'home';
  let ongoingPage     = 1;
  let completedPage   = 1;
  let moviesPage      = 1;
  let genrePage       = 1;
  let currentGenre    = null;
  let searchTimer     = null;

  const hofData = [
    { name:'Aldi M.',    amount:50000, msg:'Terus semangat!' },
    { name:'Anonim',     amount:15000, msg:'Keep it up dev!' },
    { name:'Rizky F.',   amount:25000, msg:'Mantap websitenya' },
    { name:'Siti N.',    amount:10000, msg:'❤️' },
    { name:'Joko W.',    amount:50000, msg:'Sukses terus!' },
  ];

  /* ===========================================================
     PAGE NAVIGATION
     =========================================================== */
  function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${name}`).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.page === name));
    currentPage = name;

    // Scroll to just below hero (or top for non-home)
    const heroH = document.getElementById('hero').offsetHeight;
    window.scrollTo({ top: name === 'home' ? 0 : heroH - 62, behavior: 'smooth' });

    // Lazy-load content
    if (name === 'ongoing'   && !document.getElementById('ongoing-grid').dataset.loaded)   loadOngoing(true);
    if (name === 'completed' && !document.getElementById('completed-grid').dataset.loaded) loadCompleted(true);
    if (name === 'movies'    && !document.getElementById('movies-grid').dataset.loaded)    loadMovies(true);
    if (name === 'genre'     && !document.getElementById('genre-pills').dataset.loaded)    loadGenres();
    if (name === 'schedule'  && !document.getElementById('schedule-wrap').dataset.loaded)  loadSchedule();
    if (name === 'donate')                                                                   renderHoF();
  }

  /* ===========================================================
     HOME
     =========================================================== */
  async function loadHome() {
    const trendRow = document.getElementById('trending-row');
    const ongoRow  = document.getElementById('home-ongoing-row');
    const compRow  = document.getElementById('home-completed-row');

    trendRow.innerHTML = UI.skeletons(8, true);
    ongoRow.innerHTML  = UI.skeletons(8, true);
    compRow.innerHTML  = UI.skeletons(8, true);

    const [homeRaw, ongoingItems, completedItems] = await Promise.all([
      API.home(),
      API.ongoing(1),
      API.completed(1),
    ]);

    // Trending — use the best list from home endpoint
    if (homeRaw) {
      const d  = homeRaw.data ?? homeRaw.result ?? homeRaw;
      const trending = d?.popular ?? d?.latestAnime ?? d?.popularAnime
                    ?? d?.ongoing  ?? d?.slider
                    ?? (Array.isArray(d) ? d : []);
      if (trending.length) {
        UI.renderGrid(trendRow, trending.slice(0, 14), true);
      } else {
        trendRow.innerHTML = UI.errorBlock('Data trending tidak tersedia.');
      }
    } else {
      trendRow.innerHTML = UI.errorBlock('Gagal memuat data dari API. Periksa koneksi & buka melalui web server.');
    }

    // Ongoing strip
    if (ongoingItems.length) {
      UI.renderGrid(ongoRow, ongoingItems.slice(0, 14), true);
    } else {
      ongoRow.innerHTML = UI.errorBlock('Data ongoing tidak tersedia.');
    }

    // Completed strip
    if (completedItems.length) {
      UI.renderGrid(compRow, completedItems.slice(0, 14), true);
    } else {
      compRow.innerHTML = UI.errorBlock('Data completed tidak tersedia.');
    }
  }

  /* ===========================================================
     ONGOING
     =========================================================== */
  async function loadOngoing(fresh = false) {
    if (fresh) { ongoingPage = 1; }
    const grid = document.getElementById('ongoing-grid');
    if (fresh) { grid.innerHTML = UI.skeletons(16); grid.removeAttribute('data-loaded'); }

    const items = await API.ongoing(ongoingPage);
    if (fresh) grid.innerHTML = '';

    if (items.length) {
      grid.insertAdjacentHTML('beforeend', items.map(a => UI.card(a)).join(''));
      UI.bindCardClicks(grid);
      grid.dataset.loaded = '1';
    } else if (fresh) {
      grid.innerHTML = UI.errorBlock('Data ongoing tidak ditemukan.', 'App.reloadOngoing');
    }
  }

  function reloadOngoing() { loadOngoing(true); }
  function moreOngoing()   { ongoingPage++; loadOngoing(); }

  /* ===========================================================
     COMPLETED
     =========================================================== */
  async function loadCompleted(fresh = false) {
    if (fresh) completedPage = 1;
    const grid = document.getElementById('completed-grid');
    if (fresh) { grid.innerHTML = UI.skeletons(16); grid.removeAttribute('data-loaded'); }

    const items = await API.completed(completedPage);
    if (fresh) grid.innerHTML = '';

    if (items.length) {
      grid.insertAdjacentHTML('beforeend', items.map(a => UI.card(a)).join(''));
      UI.bindCardClicks(grid);
      grid.dataset.loaded = '1';
    } else if (fresh) {
      grid.innerHTML = UI.errorBlock('Data completed tidak ditemukan.', 'App.reloadCompleted');
    }
  }
  function reloadCompleted() { loadCompleted(true); }
  function moreCompleted()   { completedPage++; loadCompleted(); }

  /* ===========================================================
     MOVIES
     =========================================================== */
  async function loadMovies(fresh = false) {
    if (fresh) moviesPage = 1;
    const grid = document.getElementById('movies-grid');
    if (fresh) { grid.innerHTML = UI.skeletons(16); grid.removeAttribute('data-loaded'); }

    const items = await API.movies(moviesPage);
    if (fresh) grid.innerHTML = '';

    if (items.length) {
      grid.insertAdjacentHTML('beforeend', items.map(a => UI.card(a)).join(''));
      UI.bindCardClicks(grid);
      grid.dataset.loaded = '1';
    } else if (fresh) {
      grid.innerHTML = UI.errorBlock('Data movie tidak ditemukan.', 'App.reloadMovies');
    }
  }
  function reloadMovies() { loadMovies(true); }
  function moreMovies()   { moviesPage++; loadMovies(); }

  /* ===========================================================
     GENRES
     =========================================================== */
  const FALLBACK_GENRES = [
    'Action','Adventure','Comedy','Drama','Ecchi','Fantasy',
    'Horror','Josei','Magic','Mecha','Military','Mystery',
    'Psychological','Romance','School','Sci-Fi','Seinen','Shounen',
    'Slice of Life','Sports','Super Power','Supernatural','Thriller'
  ];

  async function loadGenres() {
    const pillsEl = document.getElementById('genre-pills');
    pillsEl.innerHTML = '<span style="color:var(--text2)">Memuat genre...</span>';
    pillsEl.dataset.loaded = '1';

    const data = await API.genres();

    let genres = data;
    if (!genres.length) genres = FALLBACK_GENRES.map(n => ({ name: n, genreId: n.toLowerCase() }));

    pillsEl.innerHTML = genres.map(g => {
      const name = g.name || g.genreName || g.genre || (typeof g === 'string' ? g : '?');
      const slug = g.genreId || g.slug || g.endpoint || (typeof g === 'string' ? g.toLowerCase() : name.toLowerCase());
      return `<button class="gpill" data-slug="${slug}" data-name="${name}" onclick="App.filterGenre(this)">${name}</button>`;
    }).join('');
  }

  async function filterGenre(el) {
    document.querySelectorAll('.gpill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');

    const slug = el.dataset.slug;
    const name = el.dataset.name;
    currentGenre = slug;
    genrePage    = 1;

    const resultsEl = document.getElementById('genre-results');
    resultsEl.innerHTML = `<div class="anime-grid">${UI.skeletons(12)}</div>`;

    const items = await API.byGenre(slug, 1);
    if (items.length) {
      resultsEl.innerHTML = `<div class="anime-grid">${items.map(a => UI.card(a)).join('')}</div>`;
      UI.bindCardClicks(resultsEl);
    } else {
      resultsEl.innerHTML = `<div class="api-error"><div class="err-icon">😔</div><p>Tidak ada anime untuk genre <strong>${name}</strong>.</p></div>`;
    }
  }

  /* ===========================================================
     SCHEDULE
     =========================================================== */
  async function loadSchedule() {
    const wrap = document.getElementById('schedule-wrap');
    wrap.dataset.loaded = '1';
    wrap.innerHTML = '<p style="color:var(--text2)">Memuat jadwal...</p>';

    const data = await API.schedule();
    const days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
    const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0

    let byDay = {};
    if (data) {
      const d = data.data ?? data.result ?? data;
      if (Array.isArray(d)) {
        d.forEach(item => {
          const day = item.day || item.hari || '';
          if (day) { if (!byDay[day]) byDay[day] = []; byDay[day].push(item); }
        });
      } else if (typeof d === 'object') {
        byDay = d;
      }
    }

    wrap.innerHTML = days.map((day, i) => {
      const isToday  = i === todayIdx;
      const animes   = byDay[day] || byDay[day.toLowerCase()] || [];
      const itemsHtml = animes.slice(0, 10).map(a => {
        const title = a.title || a.judul || a.name || 'Unknown';
        const time  = a.time || a.jam || '';
        const slug  = a.animeId || a.slug || '';
        return `
          <div class="sched-item" onclick="App.openDetail('${slug}','${encodeURIComponent(title)}')">
            ${time ? `<div class="sched-time">🕐 ${time}</div>` : ''}
            <div>${title}</div>
          </div>`;
      }).join('');
      return `
        <div class="sched-day">
          <div class="sched-head${isToday ? ' today' : ''}">${day}${isToday ? ' ⬅' : ''}</div>
          <div class="sched-items">
            ${itemsHtml || '<p style="color:var(--text2);font-size:11px;padding:6px">Tidak ada jadwal</p>'}
          </div>
        </div>`;
    }).join('');
  }

  /* ===========================================================
     SEARCH
     =========================================================== */
  function openSearch() {
    document.getElementById('search-overlay').classList.add('open');
    setTimeout(() => document.getElementById('srch-input').focus(), 80);
  }

  function closeSearch() {
    document.getElementById('search-overlay').classList.remove('open');
  }

  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(doSearch, 480);
  }

  async function doSearch() {
    const q = document.getElementById('srch-input').value.trim();
    const resultsEl = document.getElementById('srch-results');
    if (!q) { resultsEl.innerHTML = ''; return; }

    resultsEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text2)">🔍 Mencari "<strong>${q}</strong>"...</div>`;

    const items = await API.search(q);
    if (items.length) {
      resultsEl.innerHTML = items.map(a => UI.card(a)).join('');
      UI.bindCardClicks(resultsEl);
    } else {
      resultsEl.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text2)">
          <div style="font-size:2.8rem;margin-bottom:.8rem">😔</div>
          <p>Anime "<strong style="color:var(--text)">${q}</strong>" tidak ditemukan.</p>
        </div>`;
    }
  }

  /* ===========================================================
     ANIME DETAIL MODAL
     =========================================================== */
  async function openDetail(slug, titleEncoded) {
    if (!slug) { UI.toast('Data anime tidak ditemukan', 'error'); return; }
    const title = decodeURIComponent(titleEncoded || '');

    const modal   = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    content.innerHTML = `
      <div style="text-align:center;padding:5rem;color:var(--text2)">
        <div style="font-size:2.5rem;margin-bottom:.8rem">⏳</div>
        <p>Memuat detail anime...</p>
      </div>`;

    const data = await API.animeDetail(slug);

    if (!data) {
      content.innerHTML = `
        <div style="text-align:center;padding:5rem;color:var(--text2)">
          <div style="font-size:2.5rem;margin-bottom:.8rem">😢</div>
          <p>Gagal memuat detail. Pastikan web server aktif.</p>
          <button class="btn btn-ghost btn-sm" onclick="App.closeDetail()" style="margin-top:1rem">Tutup</button>
        </div>`;
      return;
    }

    const animeTitle = data.title  || data.judul || title;
    const img        = data.poster || data.thumbnail || data.thumb || UI.IMG_FB;
    const synopsis   = data.synopsis || data.sinopsis || data.description || 'Tidak ada sinopsis.';
    const status     = data.animeStatus || data.status || '';
    const type       = data.type   || data.tipe || 'TV';
    const studio     = data.studio || '';
    const season     = data.season || '';
    const genres     = data.genreList  || data.genres || data.genre || [];
    const episodes   = data.episodeList || data.episodes || data.episode_list || [];

    const genreTags = (Array.isArray(genres) ? genres : []).map(g =>
      `<span class="dtag">${g.genreName || g.name || g.genre || g}</span>`
    ).join('');

    const episodesHtml = episodes.length
      ? episodes.map(ep => {
          const epSlug  = ep.episodeId || ep.slug || ep.endpoint || '';
          const epLabel = ep.episodeNum != null
            ? `Episode ${ep.episodeNum}`
            : (ep.episode || ep.eps || ep.name || ep.title || 'Episode');
          return `<button class="ep-btn" data-ep-slug="${epSlug}" data-ep-title="${encodeURIComponent(animeTitle + ' — ' + epLabel)}">${epLabel}</button>`;
        }).join('')
      : '<p style="color:var(--text2);font-size:13px">Episode belum tersedia.</p>';

    content.innerHTML = `
      <div class="detail-hero">
        <div class="detail-poster">
          <img src="${img}" alt="${animeTitle}" onerror="this.src='${UI.IMG_FB}'">
        </div>
        <div class="detail-info">
          <h1>${animeTitle}</h1>
          <div class="detail-tags">
            ${status ? `<span class="dtag ${status.toLowerCase().includes('ongoing') ? 'green' : 'cyan'}">${status}</span>` : ''}
            ${type   ? `<span class="dtag">${type}</span>`   : ''}
            ${studio ? `<span class="dtag">${studio}</span>` : ''}
            ${season ? `<span class="dtag">${season}</span>` : ''}
            ${genreTags}
          </div>
          <p class="detail-synopsis">${synopsis}</p>
          <div class="detail-actions">
            ${episodes.length
              ? `<button class="btn btn-accent" id="watch-first-btn">▶ Tonton</button>`
              : ''}
            <button class="btn btn-ghost" id="dl-all-btn">⬇ Download</button>
          </div>
        </div>
      </div>
      <div class="eps-section">
        <div class="eps-title">
          📺 Daftar Episode <span class="eps-count">(${episodes.length} eps)</span>
        </div>
        <div class="eps-grid" id="eps-grid">
          ${episodesHtml}
        </div>
      </div>`;

    // Bind episode buttons
    content.querySelectorAll('.ep-btn').forEach(btn => {
      btn.onclick = () => {
        content.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Player.open(btn.dataset.epSlug, decodeURIComponent(btn.dataset.epTitle));
      };
    });

    // Watch first episode
    const watchBtn = document.getElementById('watch-first-btn');
    if (watchBtn && episodes.length) {
      const last = episodes[episodes.length - 1];
      const lastSlug  = last.episodeId || last.slug || last.endpoint || '';
      const lastLabel = last.episodeNum != null ? `Episode ${last.episodeNum}` : 'Episode';
      watchBtn.onclick = () => Player.open(lastSlug, `${animeTitle} — ${lastLabel}`);
    }

    // Download
    const dlBtn = document.getElementById('dl-all-btn');
    if (dlBtn) {
      dlBtn.onclick = () => Download.open(animeTitle, []);
    }
  }

  function closeDetail() {
    document.getElementById('detail-modal').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ===========================================================
     DONATE
     =========================================================== */
  function openDonate(amount) {
    UI.toast(`Terima kasih! Mengarahkan ke halaman donasi Rp ${parseInt(amount).toLocaleString('id')}…`, 'info');
    // window.open('https://sociabuzz.com/sankavollerei/tribe', '_blank');
  }

  function submitDonate() {
    const name   = document.getElementById('dn-name').value.trim()   || 'Anonim';
    const amount = parseInt(document.getElementById('dn-amount').value) || 0;
    const msg    = document.getElementById('dn-msg').value.trim();

    if (amount < 1000) { UI.toast('Masukkan nominal minimal Rp 1.000', 'error'); return; }

    hofData.unshift({ name, amount, msg });
    renderHoF();
    UI.toast(`Terima kasih ${name}! Donasi Rp ${amount.toLocaleString('id')} diterima ❤️`, 'success');
    document.getElementById('dn-name').value = '';
    document.getElementById('dn-amount').value = '';
    document.getElementById('dn-msg').value = '';
  }

  function renderHoF() {
    const el = document.getElementById('hof-grid');
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = hofData.map((d, i) => `
      <div class="hof-card">
        <div style="font-size:1.5rem;margin-bottom:.3rem">${medals[i] || '⭐'}</div>
        <div style="font-weight:700;font-size:13px;margin-bottom:2px">${d.name}</div>
        <div class="hof-amt">Rp ${d.amount.toLocaleString('id')}</div>
        ${d.msg ? `<div class="hof-msg">"${d.msg}"</div>` : ''}
      </div>`).join('');
  }

  /* ===========================================================
     BUG REPORT
     =========================================================== */
  function submitBug() {
    const type = document.getElementById('bug-type').value;
    const desc = document.getElementById('bug-desc').value.trim();
    if (!type) { UI.toast('Pilih jenis bug terlebih dahulu', 'error'); return; }
    if (!desc) { UI.toast('Deskripsikan bug yang ditemukan', 'error'); return; }
    UI.toast('Laporan berhasil dikirim! Terima kasih 🙏', 'success');
    document.getElementById('bug-type').value = '';
    document.getElementById('bug-anime').value = '';
    document.getElementById('bug-desc').value = '';
    document.getElementById('bug-email').value = '';
  }

  function submitFeature() {
    const name = document.getElementById('feat-name').value.trim();
    const desc = document.getElementById('feat-desc').value.trim();
    if (!name) { UI.toast('Masukkan nama fitur', 'error'); return; }
    if (!desc) { UI.toast('Jelaskan fiturnya dulu', 'error'); return; }
    UI.toast('Ide fitur dikirim! Kami akan mempertimbangkannya ✨', 'success');
    document.getElementById('feat-name').value = '';
    document.getElementById('feat-desc').value = '';
  }

  /* ===========================================================
     HERO CANVAS ANIMATION
     =========================================================== */
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let frame = 0;
    const circles = [
      { cx: .25, cy: .45, r: .28, color: 'rgba(233,69,96,' },
      { cx: .75, cy: .55, r: .35, color: 'rgba(168,85,247,' },
      { cx: .50, cy: .25, r: .18, color: 'rgba(34,211,238,' },
    ];

    ;(function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      circles.forEach((c, i) => {
        const x = (c.cx + Math.sin(frame * .009 + i * 2.1) * .06) * w;
        const y = (c.cy + Math.cos(frame * .007 + i) * .04) * h;
        const r = c.r * Math.min(w, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, c.color + '.22)');
        g.addColorStop(1, c.color + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      });

      // Stars
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137.5) % w;
        const sy = (i * 93.7)  % h;
        const a  = (Math.sin(frame * .04 + i) + 1) * .4;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI * 2); ctx.fill();
      }
      frame++;
      requestAnimationFrame(draw);
    })();
  }

  /* ===========================================================
     INIT
     =========================================================== */
  function init() {
    initHeroCanvas();
    loadHome();

    // Back to top
    window.addEventListener('scroll', () => {
      document.getElementById('back-top').classList.toggle('show', window.scrollY > 480);
    });

    // Search input events
    document.getElementById('srch-input').addEventListener('input', onSearchInput);
    document.getElementById('srch-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch();
      if (e.key === 'Escape') closeSearch();
    });

    // Global escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeSearch();
        closeDetail();
        Player.close();
        Download.close();
      }
    });
  }

  /* public surface */
  return {
    showPage, openDetail, closeDetail,
    openSearch, closeSearch, doSearch, onSearchInput,
    filterGenre,
    moreOngoing, reloadOngoing,
    moreCompleted, reloadCompleted,
    moreMovies, reloadMovies,
    openDonate, submitDonate,
    submitBug, submitFeature,
    init,
  };
})();

/* Boot when DOM ready */
document.addEventListener('DOMContentLoaded', App.init);
