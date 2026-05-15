/* ============================================================
   StreetCars Manchester — Pickup Guidance
   ============================================================
   FLOW
     1. Booking ID entry (8 digits)        → calls /api/booking/{id}
     2. Terminal picker                    (or auto-skipped if API tells us)
     3. Step-by-step navigation            (call + callback at bottom)
     4. Arrived screen                     (driver info + tracking link)

   All user-facing copy lives in i18n.js — edit translations there.
   This file holds ONLY data that doesn't translate (photos, times,
   directions, badge colours) plus the flow/render logic.
============================================================ */

/* ============================================================
   ROUTES — non-translated data (photos, times, directions).
   The textual step copy lives under `route.<key>.*` keys in i18n.js.
============================================================ */
const ROUTES = {
  T2: {
    key: 't2',
    badgeColour: '#2D5F3F',
    steps: [
      { time: '30s', direction: 'left',    photo: 'photos/t2-step1.jpg' },
      { time: '45s', direction: 'forward', photo: 'photos/t2-step2.jpg' },
      { time: '30s', direction: 'forward', photo: 'photos/t2-step3.jpg' },
      { time: '45s', direction: 'forward', photo: 'photos/t2-step4.jpg' }
    ],
    pickup: { photo: 'photos/t2-pickup.jpg' }
  },
  T3: {
    key: 't3',
    badgeColour: '#2A4A6B',
    steps: [
      { time: '30s', direction: 'left',    photo: 'photos/t3-step1.jpg' },
      { time: '45s', direction: 'forward', photo: 'photos/t3-step2.jpg' },
      { time: '30s', direction: 'right',   photo: 'photos/t3-step3.jpg' },
      { time: '45s', direction: 'left',    photo: 'photos/t3-step4.jpg' },
      { time: '30s', direction: 'right',   photo: 'photos/t3-step5.jpg' },
      { time: '30s', direction: 'forward', photo: 'photos/t3-step6.jpg' }
    ],
    pickup: { photo: 'photos/t3-pickup.jpg' }
  }
};

/* Translation helpers for route copy */
function routeName(id)            { return t('route.' + ROUTES[id].key + '.name'); }
function routeDetail(id)          { return t('route.' + ROUTES[id].key + '.detail'); }
function stepInstruction(id, idx) { return t('route.' + ROUTES[id].key + '.step' + (idx + 1) + '.instruction'); }
function stepDetail(id, idx)      { return t('route.' + ROUTES[id].key + '.step' + (idx + 1) + '.detail'); }
function pickupSpot(id)           { return t('route.' + ROUTES[id].key + '.pickup.spot'); }
function pickupDetail(id)         { return t('route.' + ROUTES[id].key + '.pickup.detail'); }

/* Tiny HTML escape so translations are safe to inject via innerHTML */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ============================================================
   App state
============================================================ */
const state = {
  view: 'entry',
  mode: null,       // 'with-booking' | 'browse' | null
  bookingId: null,
  booking: null,    // { driver, car, plate, phone, trackingUrl, terminal }
  terminal: null,
  stepIdx: 0
};

/* ============================================================
   DOM references
============================================================ */
const $ = (id) => document.getElementById(id);

const els = {
  views: {
    entry:    $('view-entry'),
    booking:  $('view-booking'),
    picker:   $('view-picker'),
    nav:      $('view-nav'),
    arrived:  $('view-arrived')
  },
  // Entry
  entryYes:       $('entry-yes'),
  entryNo:        $('entry-no'),
  // Booking
  bookingForm:    $('booking-form'),
  bookingInput:   $('booking-input'),
  bookingError:   $('booking-error'),
  bookingSubmit:  $('booking-submit'),
  // Picker
  pickerEyebrow:  $('picker-eyebrow'),
  terminalsList:  $('terminals-list'),
  // Nav
  backBtn:        $('back-btn'),
  nextBtn:        $('next-btn'),
  callbackBtn:    $('callback-btn'),
  callDriverBtn:  $('call-driver-btn'),
  progressSteps:  $('progress-steps'),
  stepProgressLabel: $('step-progress-label'),
  stepPhoto:      $('step-photo'),
  stepInstruction:$('step-instruction'),
  stepDetail:     $('step-detail'),
  // Arrived
  pickupPhoto:    $('pickup-photo'),
  pickupSpot:     $('pickup-spot'),
  pickupDetail:   $('pickup-detail'),
  driverAvatar:   $('driver-avatar'),
  driverName:     $('driver-name'),
  driverVehicle:  $('driver-vehicle'),
  trackBtn:       $('track-btn'),
  arrivedCallBtn: $('arrived-call-btn'),
  arrivedCallbackBtn: $('arrived-callback-btn'),
  // Dialog
  dialog:             $('callback-dialog'),
  dialogForm:         $('callback-form'),
  dialogClose:        $('dialog-close'),
  dialogCancel:       $('dialog-cancel'),
  dialogSubmit:       $('dialog-submit'),
  dialogError:        $('dialog-error'),
  dialogFormView:     $('dialog-form-view'),
  dialogSuccessView:  $('dialog-success-view'),
  dialogDone:         $('dialog-done'),
  previewPhone:       $('preview-phone'),
  previewMessage:     $('preview-message'),
  previewPhoneRow:    $('preview-phone-row'),
  previewMessageRow:  $('preview-message-row'),
  callbackPhone:      $('callback-phone'),
  callbackMessage:    $('callback-message'),
  // Arrived (browse mode)
  arrivedILandedBtn:  $('arrived-i-landed-btn')
};

/* ============================================================
   Step 1 — Booking ID entry
============================================================ */
function initBookingForm() {
  // Numeric-only input
  els.bookingInput.addEventListener('input', () => {
    const cleaned = els.bookingInput.value.replace(/\D/g, '').slice(0, 8);
    if (cleaned !== els.bookingInput.value) els.bookingInput.value = cleaned;
    clearBookingError();
  });

  els.bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = els.bookingInput.value.trim();

    if (!/^\d{8}$/.test(id)) {
      showBookingError(t('booking.error.invalid'));
      return;
    }

    setLoading(els.bookingSubmit, true);
    try {
      const data = await api.getBooking(id);
      state.bookingId = id;
      state.booking = data;

      // If the dispatch system tells us the terminal, skip the picker.
      if (data.terminal && ROUTES[data.terminal]) {
        selectTerminal(data.terminal, /*pushHistory*/ true);
      } else {
        updatePickerEyebrow();
        showView('picker');
        history.pushState({ view: 'picker', mode: 'with-booking' }, '');
      }
    } catch (err) {
      if (err.code === 'not_found') {
        showBookingError(t('booking.error.not_found'));
      } else if (err.code === 'archived') {
        showBookingError(t('booking.error.archived'));
      } else {
        showBookingError(t('booking.error.server'));
      }
    } finally {
      setLoading(els.bookingSubmit, false);
    }
  });
}

function showBookingError(msg) {
  els.bookingError.textContent = msg;
  els.bookingError.hidden = false;
  els.bookingInput.classList.add('has-error');
}

function clearBookingError() {
  els.bookingError.hidden = true;
  els.bookingInput.classList.remove('has-error');
}

/* ============================================================
   Step 2 — Terminal picker
============================================================ */
function renderPicker() {
  els.terminalsList.innerHTML = Object.entries(ROUTES).map(([id, route]) => `
    <li>
      <button class="terminal" data-terminal="${id}" type="button">
        <span class="terminal__badge" style="background: ${route.badgeColour}1A; color: ${route.badgeColour};">${esc(id)}</span>
        <span class="terminal__info">
          <span class="terminal__name">${esc(routeName(id))}</span>
          <span class="terminal__detail">${esc(routeDetail(id))}</span>
        </span>
        <svg class="terminal__chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"/>
        </svg>
      </button>
    </li>
  `).join('');

  els.terminalsList.querySelectorAll('.terminal').forEach(btn => {
    btn.addEventListener('click', () => selectTerminal(btn.dataset.terminal, true));
  });
}

function selectTerminal(id, pushHistory) {
  if (!ROUTES[id]) return;
  state.terminal = id;
  state.stepIdx = 0;
  renderStep('forward');
  showView('nav');
  if (pushHistory) history.pushState({ view: 'nav', terminal: id, step: 0, mode: state.mode }, '');
}

/* Set the picker's eyebrow line based on the current mode/state. */
function updatePickerEyebrow() {
  if (state.mode === 'browse') {
    els.pickerEyebrow.textContent = t('picker.eyebrow.browse');
  } else if (state.booking && state.booking.passengerName) {
    els.pickerEyebrow.textContent = t('picker.eyebrow.welcome', { name: state.booking.passengerName });
  } else {
    els.pickerEyebrow.textContent = t('picker.eyebrow.confirmed');
  }
}

/* ============================================================
   Step 3 — Navigation
============================================================ */
const ARROW_PATHS = {
  forward: 'M12 4v16M6 10l6-6 6 6',
  back:    'M12 20V4M6 14l6 6 6-6',
  left:    'M4 12h16M10 6l-6 6 6 6',
  right:   'M20 12H4M14 6l6 6-6 6',
  up:      'M12 4v16M6 10l6-6 6 6',
  down:    'M12 4v16M6 14l6 6 6-6'
};

function buildPhotoHTML(step, hint, alt) {
  if (step.photo) {
    return `<img src="${esc(step.photo)}" alt="${esc(alt)}" />
            <span class="photo__hint">${esc(hint)}</span>`;
  }
  const path = ARROW_PATHS[step.direction] || ARROW_PATHS.forward;
  return `
    <div class="photo--placeholder" aria-hidden="true"></div>
    <div class="photo__arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${path}"/>
      </svg>
    </div>
    <span class="photo__hint">${esc(hint)}</span>
  `;
}

function renderStep(direction = 'forward') {
  const route = ROUTES[state.terminal];
  const step = route.steps[state.stepIdx];
  const total = route.steps.length;
  const current = state.stepIdx + 1;

  // Progress bars
  els.progressSteps.innerHTML = Array.from({ length: total }, (_, i) =>
    `<span class="${i <= state.stepIdx ? 'active' : ''}"></span>`
  ).join('');

  // Single translated label: "Step 1 of 5 · ~30s"
  els.stepProgressLabel.textContent = t('nav.step_progress', { current, total, time: step.time });

  const instruction = stepInstruction(state.terminal, state.stepIdx);
  const detail = stepDetail(state.terminal, state.stepIdx);
  els.stepInstruction.textContent = instruction;
  els.stepDetail.textContent = detail;

  els.stepPhoto.className = 'photo';
  els.stepPhoto.innerHTML = buildPhotoHTML(
    step,
    t('nav.photo_count', { current, total }),
    instruction
  );

  // Update Next button label/icon
  const isLast = state.stepIdx === total - 1;
  const labelEl = els.nextBtn.querySelector('.btn__label');
  const arrowSVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${isLast ? 'M5 12l5 5L20 7' : 'M5 12h14M13 6l6 6-6 6'}"/></svg>`;
  labelEl.textContent = isLast ? t('nav.last') : t('nav.next');
  const oldIcon = els.nextBtn.querySelector('svg');
  if (oldIcon) oldIcon.outerHTML = arrowSVG;

  // Call button — driver's phone if we have a booking, otherwise the office.
  const callLabel = els.callDriverBtn.querySelector('span');
  if (state.mode === 'browse') {
    els.callDriverBtn.href = 'tel:+441611228787';
    if (callLabel) callLabel.textContent = t('nav.call_office');
  } else {
    if (state.booking && state.booking.driver && state.booking.driver.phone) {
      els.callDriverBtn.href = `tel:${state.booking.driver.phone}`;
    }
    if (callLabel) callLabel.textContent = t('nav.call');
  }

  // Animation
  els.views.nav.classList.remove('is-entering-forward', 'is-entering-back');
  void els.views.nav.offsetWidth;
  els.views.nav.classList.add(direction === 'back' ? 'is-entering-back' : 'is-entering-forward');
}

function nextStep() {
  const route = ROUTES[state.terminal];
  if (state.stepIdx < route.steps.length - 1) {
    state.stepIdx += 1;
    renderStep('forward');
    history.pushState({ view: 'nav', terminal: state.terminal, step: state.stepIdx, mode: state.mode }, '');
  } else {
    renderArrived();
    // Notify the office via Telegram — only for real bookings; browse-mode
    // users have no booking ID and the backend would reject the call.
    if (state.mode !== 'browse' && state.bookingId) {
      api.arrived({ bookingId: state.bookingId, terminal: state.terminal })
        .catch(err => console.error('Arrival notification failed:', err));
    }
    showView('arrived');
    history.pushState({ view: 'arrived', terminal: state.terminal, mode: state.mode }, '');
  }
}

function prevStep() {
  if (state.view === 'arrived') { showView('nav'); return; }
  if (state.stepIdx > 0) {
    state.stepIdx -= 1;
    renderStep('back');
  } else {
    showView('picker');
  }
}

/* ============================================================
   Step 4 — Arrived
============================================================ */
function initials(name) {
  return name.split(/\s+/).map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
}

function renderArrived() {
  const route = ROUTES[state.terminal];
  const b = (state.booking && state.booking.driver) || {};
  const spot = pickupSpot(state.terminal);

  els.pickupSpot.textContent = spot;
  els.pickupDetail.textContent = pickupDetail(state.terminal);

  els.driverName.textContent = b.name || t('arrived.your_driver');
  els.driverVehicle.textContent = b.car && b.plate ? `${b.car} · ${b.plate}` : '';
  els.driverAvatar.textContent = b.name ? initials(b.name) : '?';

  if (b.phone) {
    els.arrivedCallBtn.href = `tel:${b.phone}`;
  }

  // Live tracking link from Autocab
  if (state.booking && state.booking.trackingUrl) {
    let url = state.booking.trackingUrl;
    if (!/^https?:/i.test(url)) url = `https://${url}`;
    els.trackBtn.href = url;
    els.trackBtn.hidden = false;
  }

  // Pickup photo
  els.pickupPhoto.className = 'photo photo--pickup';
  if (route.pickup.photo) {
    els.pickupPhoto.innerHTML = `<img src="${esc(route.pickup.photo)}" alt="${esc(spot)}" />
      <span class="photo__hint">${esc(spot)}</span>`;
  } else {
    els.pickupPhoto.innerHTML = `
      <div class="photo--placeholder" aria-hidden="true"></div>
      <div class="photo__arrow" aria-hidden="true" style="background: var(--success);">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
      </div>
      <span class="photo__hint">${esc(spot)}</span>
    `;
  }
}

/* ============================================================
   Callback dialog
============================================================ */
function openDialog() {
  resetDialog();
  if (typeof els.dialog.showModal === 'function') {
    els.dialog.showModal();
  } else {
    els.dialog.setAttribute('open', '');
  }
  setTimeout(() => els.callbackPhone.focus(), 100);
}

function closeDialog() {
  if (typeof els.dialog.close === 'function') els.dialog.close();
  else els.dialog.removeAttribute('open');
  resetDialog();
}

function resetDialog() {
  els.dialogError.hidden = true;
  els.dialogFormView.hidden = false;
  els.dialogSuccessView.hidden = true;
  els.dialogForm.reset();
  setLoading(els.dialogSubmit, false);
}

async function submitDialog(e) {
  e.preventDefault();
  els.dialogError.hidden = true;

  const phone = els.callbackPhone.value.trim();
  const message = els.callbackMessage.value.trim();

  if (!phone && !message) {
    showDialogError(t('dialog.error.phone_or_message'));
    return;
  }
  if (phone && !isValidPhone(phone)) {
    showDialogError(t('dialog.error.invalid_phone'));
    return;
  }

  setLoading(els.dialogSubmit, true);
  try {
    await api.requestCallback({
      bookingId: state.bookingId,
      phone,
      message
    });
    els.previewPhone.textContent = phone || '—';
    els.previewMessage.textContent = message || '—';
    els.previewPhoneRow.hidden = !phone;
    els.previewMessageRow.hidden = !message;
    els.dialogFormView.hidden = true;
    els.dialogSuccessView.hidden = false;
  } catch (err) {
    showDialogError(t('dialog.error.server'));
  } finally {
    setLoading(els.dialogSubmit, false);
  }
}

function showDialogError(msg) {
  els.dialogError.textContent = msg;
  els.dialogError.hidden = false;
}

function isValidPhone(p) {
  const digits = p.replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/* ============================================================
   Loading-state helper
============================================================ */
function setLoading(btn, loading) {
  if (loading) {
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
  } else {
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
  }
}

/* ============================================================
   Mode helper — toggles `.mode-browse` on nav/arrived so the
   stylesheet can hide booking-specific elements (driver card,
   tracking link) when the customer has no booking.
============================================================ */
function applyMode() {
  const isBrowse = state.mode === 'browse';
  els.views.nav.classList.toggle('mode-browse', isBrowse);
  els.views.arrived.classList.toggle('mode-browse', isBrowse);
}

/* ============================================================
   Init
============================================================ */
function init() {
  initBookingForm();

  // i18n — apply detected/stored language, then render the flag picker.
  applyLang(detectLang());
  renderLangPicker('lang-picker');

  // Render the terminal picker once (will re-render on lang change).
  renderPicker();

  // Entry — "Have you arrived?" yes/no buttons
  els.entryYes.addEventListener('click', () => {
    state.mode = 'with-booking';
    applyMode();
    showView('booking');
    history.pushState({ view: 'booking', mode: 'with-booking' }, '');
  });

  els.entryNo.addEventListener('click', () => {
    state.mode = 'browse';
    state.bookingId = null;
    state.booking = null;
    applyMode();
    updatePickerEyebrow();
    showView('picker');
    history.pushState({ view: 'picker', mode: 'browse' }, '');
  });

  els.backBtn.addEventListener('click', prevStep);
  els.nextBtn.addEventListener('click', nextStep);
  els.callbackBtn.addEventListener('click', openDialog);
  els.arrivedCallbackBtn.addEventListener('click', openDialog);

  els.dialogClose.addEventListener('click', closeDialog);
  els.dialogCancel.addEventListener('click', closeDialog);
  els.dialogDone.addEventListener('click', closeDialog);
  els.dialogForm.addEventListener('submit', submitDialog);

  // Browse-mode arrived screen: "I've arrived" → switch to with-booking flow
  if (els.arrivedILandedBtn) {
    els.arrivedILandedBtn.addEventListener('click', () => {
      state.mode = 'with-booking';
      state.bookingId = null;
      state.booking = null;
      state.terminal = null;
      state.stepIdx = 0;
      applyMode();
      showView('booking');
      history.pushState({ view: 'booking', mode: 'with-booking' }, '');
      setTimeout(() => els.bookingInput.focus(), 100);
    });
  }

  // Re-render dynamic content when the language changes.
  window.addEventListener('langchange', () => {
    renderPicker();
    updatePickerEyebrow();
    if (state.view === 'nav' && state.terminal) renderStep('forward');
    if (state.view === 'arrived' && state.terminal) renderArrived();
  });

  // Browser back button
  window.addEventListener('popstate', (e) => {
    if (!e.state) {
      state.mode = null;
      state.bookingId = null;
      state.booking = null;
      applyMode();
      showView('entry');
      return;
    }
    if (e.state.mode) {
      state.mode = e.state.mode;
      applyMode();
    }
    switch (e.state.view) {
      case 'booking':
        showView('booking');
        break;
      case 'picker':
        updatePickerEyebrow();
        showView('picker');
        break;
      case 'nav':
        if (e.state.terminal) {
          state.terminal = e.state.terminal;
          state.stepIdx = e.state.step ?? 0;
          renderStep('back');
          showView('nav');
        }
        break;
      case 'arrived':
        renderArrived();
        showView('arrived');
        break;
      default:
        showView('entry');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

/* ============================================================
   StreetCars Manchester — Services
   ============================================================
   Backend client and view-switching layer.

     - api.getBooking({id})        → driver details + tracking link
     - api.requestCallback({...})  → callback / message request
     - showView(name)              → swap the visible <section>
============================================================ */

const API_BASE = 'https://api-manair.bshire.co.uk';

class ApiError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

const api = {
  async getBooking(bookingId) {
    const res = await fetch(`${API_BASE}/api/booking/${bookingId}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.status === 404) throw new ApiError('Booking not found', 'not_found');
    if (res.status === 410) throw new ApiError('Booking no longer active', 'archived');
    if (!res.ok) throw new ApiError('Service unavailable', 'server');
    return res.json();
  },

  async requestCallback({ bookingId, phone, message }) {
    const res = await fetch(`${API_BASE}/api/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, phone, message: message || '' })
    });
    if (!res.ok) throw new ApiError('Could not send', 'server');
    return res.json();
  },

  async arrived({ bookingId, terminal }) {
    const res = await fetch(`${API_BASE}/api/arrived`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, terminal })
    });
    if (!res.ok) throw new ApiError('Service unavailable', 'server');
    return res.json();
  },
} 

/* ============================================================
   View management
============================================================ */
function showView(name) {
  Object.entries(els.views).forEach(([key, el]) => { el.hidden = (key !== name); });
  state.view = name;
  window.scrollTo({ top: 0 });
}
