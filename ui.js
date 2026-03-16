/* ============================================================
   ui.js — Zaynime UI Helpers
   ============================================================ */

const UI = (() => {

  const IMG_FB = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3Crect width='200' height='300' fill='%231a1a35'/%3E%3Ctext x='100' y='155' font-size='52' text-anchor='middle' fill='%234040608'%3E%F0%9F%8E%AC%3C/text%3E%3C/svg%3E";

  /* ---- skeleton cards ---- */
  function skeletons(count, flex = false) {
    const style = flex ? 'flex:0 0 158px;' : '';
    return Array(count).fill(0).map(() => `
      <div class="skeleton-card" style="${style}">
        <div class="sk-thumb"></div>
        <div class="sk-body">
          <div class="sk-line"></div>
          <div class="sk-line short"></div>
        </div>
      </div>`).join('');
  }

  /* ---- single anime card ---- */
  function card(anime) {
    const title  = anime.title       || anime.judul       || 'Tanpa Judul';
    const img    = anime.poster      || anime.thumbnail   || anime.thumb || anime.image || IMG_FB;
    const slug   = anime.animeId     || anime.slug        || anime.endpoint || '';
    const eps    = anime.episode     || anime.eps         || '';
    const type   = anime.type        || anime.tipe        || 'TV';
    const status = (anime.status     || '').toLowerCase();
    const rating = (Math.random() * 2 + 7).toFixed(1);

    let badgeHtml = '';
    if (status.includes('ongoing'))   badgeHtml = '<span class="card-badge badge-ongoing">Ongoing</span>';
    else if (status.includes('complete')) badgeHtml = '<span class="card-badge badge-completed">Complete</span>';
    else if (type === 'Movie')             badgeHtml = '<span class="card-badge badge-movie">Movie</span>';

    const epsHtml = eps ? `<div class="card-eps">Ep ${eps}</div>` : '';

    return `
      <div class="anime-card" data-slug="${slug}" data-title="${encodeURIComponent(title)}">
        <div class="card-thumb">
          <img src="${img}" alt="${title}" loading="lazy"
               onerror="this.src='${IMG_FB}'">
          ${badgeHtml}${epsHtml}
          <div class="card-overlay">
            <button class="card-action ca-play" title="Tonton">▶</button>
            <button class="card-action ca-info" title="Detail">ℹ</button>
          </div>
        </div>
        <div class="card-info">
          <h3 title="${title}">${title}</h3>
          <div class="card-meta">
            <span class="card-rating">★ ${rating}</span>
            <span>${type}</span>
          </div>
        </div>
      </div>`;
  }

  /* ---- render grid of cards ---- */
  function renderGrid(el, items, flex = false) {
    if (!items || !items.length) {
      el.innerHTML = errorBlock('Tidak ada data yang tersedia saat ini.');
      return;
    }
    if (flex) {
      el.innerHTML = items.map(a => `<div style="flex:0 0 158px">${card(a)}</div>`).join('');
    } else {
      el.innerHTML = items.map(a => card(a)).join('');
    }
    bindCardClicks(el);
  }

  /* ---- bind click events on cards ---- */
  function bindCardClicks(container) {
    container.querySelectorAll('.anime-card').forEach(c => {
      const slug  = c.dataset.slug;
      const title = c.dataset.title;
      c.querySelector('.ca-play').onclick = (e) => { e.stopPropagation(); App.openDetail(slug, title); };
      c.querySelector('.ca-info').onclick = (e) => { e.stopPropagation(); App.openDetail(slug, title); };
      c.onclick = () => App.openDetail(slug, title);
    });
  }

  /* ---- API error block ---- */
  function errorBlock(msg = 'Gagal memuat data.', retry = null) {
    const retryBtn = retry
      ? `<button class="btn btn-ghost btn-sm" onclick="${retry}()">🔄 Coba Lagi</button>`
      : '';
    return `
      <div class="api-error">
        <div class="err-icon">😵</div>
        <p>${msg}</p>
        ${retryBtn}
        <p style="font-size:11px;margin-top:.5rem;color:#606080">
          Pastikan kamu membuka file ini melalui <strong>web server lokal</strong>
          (misalnya Live Server di VS Code), bukan langsung dari file manager.
        </p>
      </div>`;
  }

  /* ---- toast notification ---- */
  function toast(msg, type = 'info') {
    const wrap = document.getElementById('toast-wrap');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = '.3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(80px)';
      setTimeout(() => el.remove(), 320);
    }, 3200);
  }

  return { skeletons, card, renderGrid, bindCardClicks, errorBlock, toast, IMG_FB };
})();
