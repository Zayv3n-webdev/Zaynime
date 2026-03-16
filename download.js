/* ============================================================
   download.js — Zaynime Download Modal
   ============================================================ */

const Download = (() => {

  function open(title, dlData) {
    const modal   = document.getElementById('dl-modal');
    const content = document.getElementById('dl-content');
    modal.classList.add('open');

    content.innerHTML = `<p style="color:var(--text2);font-size:12px;margin-bottom:1.4rem">📥 ${title || 'Episode'}</p>`;

    if (!dlData || !dlData.length) {
      // Placeholder UI when no download data
      const resolutions = ['360p', '480p', '720p', '1080p'];
      const servers     = ['GDrive', 'Mega', 'Mediafire', 'Zippyshare'];
      let html = '';
      resolutions.forEach(res => {
        html += `
          <div class="dl-res-group">
            <div class="dl-res-label">${res}</div>
            <div class="dl-links">
              ${servers.slice(0, 3).map(srv => `
                <a class="dl-link" href="#" onclick="UI.toast('Buka detail episode untuk link download','info');return false">
                  <span>⬇ ${srv}</span>
                  <span class="dl-server-tag">${res}</span>
                </a>`).join('')}
            </div>
          </div>`;
      });
      content.innerHTML += html;
      return;
    }

    // Render real download links
    let html = '';
    dlData.forEach(group => {
      const res   = group.resolution || group.quality || group.reso || '—';
      const links = group.links || [];
      if (!links.length && group.url) links.push({ server: group.server || '—', url: group.url });

      html += `
        <div class="dl-res-group">
          <div class="dl-res-label">${res}</div>
          <div class="dl-links">
            ${links.map(l => `
              <a class="dl-link" href="${l.url || l.src || '#'}" target="_blank" rel="noopener noreferrer">
                <span>⬇ ${l.server || l.name || '—'}</span>
                <span class="dl-server-tag">${res}</span>
              </a>`).join('')}
          </div>
        </div>`;
    });

    content.innerHTML += html || '<p style="color:var(--text2)">Link download tidak tersedia.</p>';
  }

  function close() {
    document.getElementById('dl-modal').classList.remove('open');
  }

  return { open, close };
})();
