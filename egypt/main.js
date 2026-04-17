(function () {
  'use strict';

  // ── Era class helpers ──────────────────────────────────────────
  function eraClass(era) {
    if (era === 'Old Kingdom')    return 'era-old';
    if (era === 'Middle Kingdom') return 'era-middle';
    return 'era-new';
  }

  // ── Build an event card element ────────────────────────────────
  function buildCard(event, isSpacerSlot) {
    const card = document.createElement('article');
    card.className = 'event-card';
    card.dataset.id  = event.id;
    card.dataset.era = event.era;

    if (isSpacerSlot) {
      card.classList.add('spacer');
      card.setAttribute('aria-hidden', 'true');
      return card;
    }

    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${event.title} — click to learn more`);

    card.innerHTML = `
      <span class="card-emoji" aria-hidden="true">${event.emoji}</span>
      <span class="card-date">${event.date}</span>
      <span class="card-era-badge ${eraClass(event.era)}">${event.era}</span>
      <h3 class="card-title">${event.title}</h3>
      <p class="card-desc">${event.shortDesc}</p>
      <span class="card-cta">Learn more ☥</span>
    `;

    card.addEventListener('click', () => openModal(event.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(event.id);
      }
    });

    return card;
  }

  // ── Render the timeline ────────────────────────────────────────
  // Layout mirrors the infographic: 4 cards on top row, 4 on bottom,
  // interleaved so each column has exactly one real card.
  //
  // Chronological order (oldest → newest):
  //   Djoser (2670), Khufu (2560), Mentuhotep (2055), Senusret (1870),
  //   Hatshepsut (1473), Thutmose (1458), Akhenaten (1353), Ramesses (1279)
  //
  // Top row slots:    0=Djoser, 1=spacer, 2=Mentuhotep, 3=spacer, 4=Hatshepsut, 5=spacer, 6=Akhenaten, 7=spacer
  // Bottom row slots: 0=spacer, 1=Khufu,  2=spacer,     3=Senusret, 4=spacer, 5=Thutmose, 6=spacer, 7=Ramesses

  function renderTimeline() {
    const track = document.getElementById('timeline-track');
    const bar   = document.getElementById('timeline-bar');

    const ordered = [...EVENTS].sort((a, b) => {
      const yr = e => parseInt(e.date.replace(/[^0-9]/g, ''));
      return yr(b) - yr(a); // largest BCE first (oldest)
    });

    // Which indices go on top vs bottom row
    const topIndices    = [0, 2, 4, 6]; // even positions
    const bottomIndices = [1, 3, 5, 7]; // odd positions

    const topRow    = document.createElement('div');
    topRow.className = 'cards-row';

    const bottomRow  = document.createElement('div');
    bottomRow.className = 'cards-row bottom';

    ordered.forEach((event, i) => {
      const onTop = topIndices.includes(i);
      topRow.appendChild(buildCard(event, !onTop));
      bottomRow.appendChild(buildCard(event, onTop));
    });

    track.appendChild(topRow);
    track.appendChild(bottomRow);

    // ── Timeline bar: dots + era labels ─────────────────────────
    // 8 columns; dot at each column centre
    const colCount = ordered.length;
    ordered.forEach((event, i) => {
      const pct = ((i + 0.5) / colCount) * 100;

      const dot = document.createElement('div');
      dot.className = 'bar-dot';
      dot.style.left = `${pct}%`;
      bar.appendChild(dot);
    });

    // Era boundary labels
    const eras = [
      { name: 'Old Kingdom',    startIdx: 0 },
      { name: 'Middle Kingdom', startIdx: 2 },
      { name: 'New Kingdom',    startIdx: 4 },
    ];

    eras.forEach(({ name, startIdx }) => {
      const pct = ((startIdx + 0.5) / colCount) * 100;
      const lbl = document.createElement('span');
      lbl.className = 'era-label';
      lbl.textContent = name;
      lbl.style.left = `${pct}%`;
      bar.appendChild(lbl);
    });
  }

  // ── Render glossary ───────────────────────────────────────────
  function renderGlossary() {
    const container = document.getElementById('glossary-items');
    GLOSSARY.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'glossary-item';
      div.innerHTML = `<strong>${i + 1}. ${item.term}</strong><p>${item.definition}</p>`;
      container.appendChild(div);
    });
  }

  // ── Modal ──────────────────────────────────────────────────────
  let activeCardId = null;

  function openModal(id) {
    const event = EVENTS.find(e => e.id === id);
    if (!event) return;

    // Populate content
    document.getElementById('modal-emoji').textContent      = event.emoji;
    document.getElementById('modal-era-badge').textContent  = event.era;
    document.getElementById('modal-era-badge').className    = `modal-era-badge ${eraClass(event.era)}`;
    document.getElementById('modal-dynasty').textContent    = event.dynasty;
    document.getElementById('modal-date').textContent       = event.date;
    document.getElementById('modal-title').textContent      = event.title;
    document.getElementById('modal-overview').textContent   = event.longDesc.overview;
    document.getElementById('modal-legacy-text').textContent = event.longDesc.legacy;
    document.getElementById('modal-fact-text').textContent  = event.longDesc.fact;

    // Tags
    const tagsEl = document.getElementById('modal-tags');
    tagsEl.innerHTML = event.tags
      .map(t => `<span class="modal-tag">${t}</span>`)
      .join('');

    // Achievements
    const listEl = document.getElementById('modal-achievements-list');
    listEl.innerHTML = event.longDesc.achievements
      .map(a => `<li>${a}</li>`)
      .join('');

    // Activate card highlight
    if (activeCardId) deactivateCard(activeCardId);
    activeCardId = id;
    document.querySelectorAll(`.event-card[data-id="${id}"]`).forEach(c => c.classList.add('active'));

    // Show overlay
    const overlay = document.getElementById('modal-overlay');
    overlay.removeAttribute('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('open'));
    });
    overlay.querySelector('.modal-panel').scrollTop = 0;
    document.getElementById('modal-close').focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('open');
    overlay.addEventListener('transitionend', () => {
      overlay.setAttribute('hidden', '');
    }, { once: true });

    if (activeCardId) {
      deactivateCard(activeCardId);
      activeCardId = null;
    }
    document.body.style.overflow = '';
  }

  function deactivateCard(id) {
    document.querySelectorAll(`.event-card[data-id="${id}"]`).forEach(c => c.classList.remove('active'));
  }

  // ── Era filter ─────────────────────────────────────────────────
  function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const era = btn.dataset.era;
        document.querySelectorAll('.event-card:not(.spacer)').forEach(card => {
          if (era === 'all' || card.dataset.era === era) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // ── Modal close interactions ───────────────────────────────────
  function initModalClose() {
    document.getElementById('modal-close').addEventListener('click', closeModal);

    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay.hasAttribute('hidden')) closeModal();
      }
    });
  }

  // ── Init ───────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    renderTimeline();
    renderGlossary();
    initFilters();
    initModalClose();
  });

}());
