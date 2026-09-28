(() => {
  const container = document.querySelector('#gs_res_ccl_mid');
  if (!container) return; // not a results page

  const RESULT_SEL = '.gs_r.gs_or.gs_scl';
  const PAGE_DELAY_MS = 2500; // be gentle so Scholar doesn't show a CAPTCHA

  // Matches "Cited by 123" in most languages: the cited-by link always points to /scholar?cites=
  function citationCount(result) {
    const link = result.querySelector('a[href*="cites="]');
    if (!link) return 0;
    const m = link.textContent.replace(/[.,\s]/g, '').match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }

  function yearOf(result) {
    const meta = result.querySelector('.gs_a');
    const years = meta ? meta.textContent.match(/\b(19|20)\d{2}\b/g) : null;
    return years ? parseInt(years[years.length - 1], 10) : 0;
  }

  function results() {
    return [...container.querySelectorAll(RESULT_SEL)];
  }

  function badge(result) {
    if (result.querySelector('.gcs-count')) return;
    const title = result.querySelector('.gs_rt');
    if (!title) return;
    const b = document.createElement('span');
    b.className = 'gcs-count';
    b.textContent = citationCount(result).toLocaleString();
    b.title = 'Citations';
    title.prepend(b);
  }

  results().forEach((r, i) => { r.dataset.gcsOrder = i; badge(r); });

  // --- UI ---
  const bar = document.createElement('div');
  bar.id = 'gcs-bar';
  bar.innerHTML = `
    <strong>Sort:</strong>
    <button data-sort="cites-desc">Most cited</button>
    <button data-sort="cites-asc">Least cited</button>
    <button data-sort="year-desc">Newest</button>
    <button data-sort="original">Original order</button>
    <span style="margin-left:8px">Load</span>
    <select id="gcs-pages">
      <option value="1">1 more page</option>
      <option value="2">2 more pages</option>
      <option value="4" selected>4 more pages</option>
      <option value="9">9 more pages</option>
    </select>
    <button id="gcs-load">Load &amp; sort</button>
    <span id="gcs-status"></span>`;
  container.parentNode.insertBefore(bar, container);

  const status = bar.querySelector('#gcs-status');
  let currentSort = null;

  function sortBy(mode) {
    currentSort = mode;
    const items = results();
    const key = {
      'cites-desc': (a, b) => citationCount(b) - citationCount(a),
      'cites-asc': (a, b) => citationCount(a) - citationCount(b),
      'year-desc': (a, b) => yearOf(b) - yearOf(a) || citationCount(b) - citationCount(a),
      original: (a, b) => a.dataset.gcsOrder - b.dataset.gcsOrder,
    }[mode];
    items.sort(key).forEach(r => container.appendChild(r));
    status.textContent = `${items.length} results sorted.`;
  }

  bar.querySelectorAll('button[data-sort]').forEach(btn =>
    btn.addEventListener('click', () => sortBy(btn.dataset.sort)));

  // --- Load additional result pages and merge them in ---
  let nextStart = (() => {
    const s = parseInt(new URL(location.href).searchParams.get('start') || '0', 10);
    return s + results().length;
  })();

  const loadBtn = bar.querySelector('#gcs-load');
  loadBtn.addEventListener('click', async () => {
    const pages = parseInt(bar.querySelector('#gcs-pages').value, 10);
    loadBtn.disabled = true;
    const seen = new Set(results().map(r => r.dataset.cid).filter(Boolean));

    for (let p = 0; p < pages; p++) {
      status.textContent = `Loading page ${p + 1} of ${pages}…`;
      const url = new URL(location.href);
      url.searchParams.set('start', nextStart);
      let doc;
      try {
        const res = await fetch(url, { credentials: 'include' });
        doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      } catch (e) {
        status.textContent = `Failed to load more results (${e.message}).`;
        break;
      }
      const fetched = [...doc.querySelectorAll(`#gs_res_ccl_mid ${RESULT_SEL}`)];
      if (!fetched.length) {
        status.textContent = doc.querySelector('#gs_captcha_f, #captcha-form, form[action*="sorry"]')
          ? 'Google Scholar asked for a CAPTCHA. Solve it in a new tab, then try again.'
          : 'No more results.';
        break;
      }
      const base = results().length;
      fetched.forEach((r, i) => {
        if (r.dataset.cid && seen.has(r.dataset.cid)) return;
        seen.add(r.dataset.cid);
        const node = document.importNode(r, true);
        node.dataset.gcsOrder = base + i;
        badge(node);
        container.appendChild(node);
      });
      nextStart += fetched.length;
      if (p < pages - 1) await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
    }

    sortBy(currentSort || 'cites-desc');
    loadBtn.disabled = false;
  });
})();
