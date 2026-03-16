/* ============================================================
   api.js — Zaynime API Layer  v2
   Base    : https://www.sankavollerei.com/anime/otakudesu
   Fix     : CORS proxy chain + correct response shape parsing
   ============================================================ */

const API = (() => {

  const BASE = 'https://www.sankavollerei.com/anime/otakudesu';

  const PROXIES = [
    {
      wrap : (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      parse: (res)  => res.json(),
    },
    {
      wrap : (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      parse: async (res) => {
        const j = await res.json();
        return JSON.parse(j.contents);
      },
    },
    {
      wrap : (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      parse: (res)  => res.json(),
    },
  ];

  async function get(path) {
    const target = BASE + path;

    // 1. Coba direct dulu
    try {
      const r = await fetch(target, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const j = await r.json();
        console.log('[API] direct OK:', path);
        return j;
      }
    } catch (_) {}

    // 2. Fallback ke setiap CORS proxy
    for (const proxy of PROXIES) {
      try {
        const proxyUrl = proxy.wrap(target);
        const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
        if (!r.ok) continue;
        const json = await proxy.parse(r);
        if (json) {
          console.log('[API] proxy OK:', path);
          return json;
        }
      } catch (e) {
        console.warn('[API] proxy failed:', e.message);
      }
    }

    console.error('[API] semua gagal:', path);
    return null;
  }

  /* Normalise list */
  function list(raw) {
    if (!raw) return [];
    const d = raw.data ?? raw.result ?? raw;
    if (Array.isArray(d)) return d;
    if (typeof d !== 'object' || d === null) return [];

    const KEYS = [
      'animeList','genreList','scheduleList','episodeList',
      'latestAnime','ongoingAnime','completedAnime','popularAnime','sliderAnime',
      'ongoing','completed','popular','latest','result',
    ];
    for (const key of KEYS) {
      if (Array.isArray(d[key]) && d[key].length) return d[key];
    }
    for (const v of Object.values(d)) {
      if (Array.isArray(v) && v.length) return v;
    }
    return [];
  }

  /* Normalise detail */
  function detail(raw) {
    if (!raw) return null;
    const d = raw.data ?? raw.result ?? raw;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      if (d.animeDetail)   return d.animeDetail;
      if (d.episodeDetail) return d.episodeDetail;
    }
    return d;
  }

  return {
    async home()                   { return get('/home'); },
    async ongoing(page = 1)        { return list(await get(`/ongoing?page=${page}`)); },
    async completed(page = 1)      { return list(await get(`/completed?page=${page}`)); },
    async movies(page = 1)         { return list(await get(`/movies?page=${page}`)); },
    async schedule()               { return get('/schedule'); },
    async search(q)                { return list(await get(`/search?q=${encodeURIComponent(q)}`)); },
    async genres()                 { return list(await get('/genres')); },
    async byGenre(slug, page = 1)  { return list(await get(`/genres/${slug}?page=${page}`)); },
    async animeDetail(slug)        { return detail(await get(`/anime/${slug}`)); },
    async episode(slug)            { return detail(await get(`/episode/${slug}`)); },
  };
})();