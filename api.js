/* ============================================================
   api.js — Zaynime API Layer
   Base : https://www.sankavollerei.com/anime/otakudesu
   ============================================================ */

const API = (() => {
  const BASE = 'https://www.sankavollerei.com/anime/otakudesu';

  /* ---------- low-level fetch ---------- */
  async function get(path) {
    try {
      const url = BASE + path;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        console.warn(`[API] ${res.status} — ${url}`);
        return null;
      }

      const json = await res.json();
      return json;
    } catch (err) {
      // Typical culprits: CORS, network, DNS
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        console.error('[API] CORS / Network error:', err.message);
      } else {
        console.error('[API] Error:', err.message);
      }
      return null;
    }
  }

  /* ---------- normalise response ---------- */
  // API returns either { status:'Ok', data:[...] } or { status:'Ok', data:{...} }
  function list(raw) {
    if (!raw) return [];
    const d = raw.data ?? raw.result ?? raw;
    if (Array.isArray(d)) return d;

    // Home endpoint nests multiple arrays
    for (const key of ['ongoing', 'completed', 'latest', 'popular', 'latestAnime',
                        'ongoingAnime', 'completedAnime', 'sliderAnime', 'popularAnime']) {
      if (Array.isArray(d[key])) return d[key];
    }
    // Fallback: first array found
    if (typeof d === 'object') {
      for (const v of Object.values(d)) {
        if (Array.isArray(v) && v.length) return v;
      }
    }
    return [];
  }

  function detail(raw) {
    if (!raw) return null;
    return raw.data ?? raw.result ?? raw;
  }

  /* ---------- public endpoints ---------- */
  return {
    /* Home — returns raw so caller can grab multiple sections */
    async home() {
      return get('/home');
    },

    /* Ongoing list  (page optional) */
    async ongoing(page = 1) {
      const r = await get(`/ongoing?page=${page}`);
      return list(r);
    },

    /* Completed list */
    async completed(page = 1) {
      const r = await get(`/completed?page=${page}`);
      return list(r);
    },

    /* Movie list */
    async movies(page = 1) {
      const r = await get(`/movies?page=${page}`);
      return list(r);
    },

    /* Schedule */
    async schedule() {
      return get('/schedule');
    },

    /* Search */
    async search(q) {
      const r = await get(`/search?q=${encodeURIComponent(q)}`);
      return list(r);
    },

    /* All genres */
    async genres() {
      const r = await get('/genres');
      return list(r);
    },

    /* Anime by genre slug */
    async byGenre(slug, page = 1) {
      const r = await get(`/genres/${slug}?page=${page}`);
      return list(r);
    },

    /* Anime detail — slug comes from card data */
    async animeDetail(slug) {
      const r = await get(`/anime/${slug}`);
      return detail(r);
    },

    /* Episode detail */
    async episode(slug) {
      const r = await get(`/episode/${slug}`);
      return detail(r);
    }
  };
})();
