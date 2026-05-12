/* ============================================================
   StreetCars Manchester — Pickup Guidance
   ============================================================
   FLOW
     1. Booking ID entry (8 digits)        → calls /api/booking/{id}
     2. Terminal picker                    (or auto-skipped if API tells us)
     3. Step-by-step navigation            (call + callback at bottom)
     4. Arrived screen                     (driver info + tracking link)

   The backend client (booking + callback requests) and view-switching
   live in services.js. Edit terminal copy, photos, and step ordering
   in the ROUTES object below.
============================================================ */

/* ============================================================
   ROUTES — edit step text, directions, and photo URLs here
============================================================ */
const ROUTES = {
  T2: {
    name: 'Terminal 2',
    detail: 'New extension — most European flights',
    badgeColour: '#2D5F3F',
    steps: [
      { instruction: 'Leave Arrivals via the main exit',  detail: 'Head straight for the bright "Welcome to Manchester" archway.', time: '45s', direction: 'forward', photo: null },
      { instruction: 'Turn right toward Costa Coffee',    detail: 'Walk past the meet-and-greet area. Costa will be on your left.', time: '40s', direction: 'right',   photo: null },
      { instruction: 'Take the escalator up one level',   detail: 'Look for "Pickup / Drop-off" signs by the M&S Food shop.',       time: '60s', direction: 'up',      photo: null },
      { instruction: 'Cross the covered walkway',         detail: 'Follow the orange line on the floor to the pickup zone.',       time: '90s', direction: 'forward', photo: null }
    ],
    pickup: { spot: 'Bay 14, Pickup Plaza', detail: 'Wait under the StreetCars signpost. Your driver will pull up to the kerb.', photo: null }
  },
  T3: {
    name: 'Terminal 3',
    detail: 'Domestic and short-haul European',
    badgeColour: '#2A4A6B',
    steps: [
      { instruction: 'Exit Arrivals through Door 3',                detail: 'Straight ahead after baggage reclaim.',                          time: '30s', direction: 'forward', photo: null },
      { instruction: 'Turn left and follow the orange floor markers', detail: 'Past the Boots pharmacy. Look for overhead "Taxi Pickup" signs.', time: '60s', direction: 'left',    photo: null },
      { instruction: 'Continue down the ramp',                       detail: 'Gentle slope — easier with bags than the stairs alongside.',     time: '50s', direction: 'down',    photo: null }
    ],
    pickup: { spot: 'Bay A, Ground Level', detail: 'Just outside the doors at the end of the ramp.', photo: null }
  }
};

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
  stepCurrent:    $('step-current'),
  stepTotal:      $('step-total'),
  stepTime:       $('step-time'),
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
      showBookingError('Please enter all 8 digits of your booking ID.');
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
        if (data.passengerName) {
          els.pickerEyebrow.textContent = `Welcome, ${data.passengerName}`;
        }
        showView('picker');
        history.pushState({ view: 'picker', mode: 'with-booking' }, '');
      }
    } catch (err) {
      if (err.code === 'not_found') {
        showBookingError("We couldn't find that booking. Please check the number and try again.");
      } else {
        showBookingError("Something went wrong. Please try again or call us on 0161 228 7878.");
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
        <span class="terminal__badge" style="background: ${route.badgeColour}1A; color: ${route.badgeColour};">${id}</span>
        <span class="terminal__info">
          <span class="terminal__name">${route.name}</span>
          <span class="terminal__detail">${route.detail}</span>
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

function buildPhotoHTML(step, hint) {
  if (step.photo) {
    return `<img src="${step.photo}" alt="${step.instruction}" />
            <span class="photo__hint">${hint}</span>`;
  }
  const path = ARROW_PATHS[step.direction] || ARROW_PATHS.forward;
  return `
    <div class="photo--placeholder" aria-hidden="true"></div>
    <div class="photo__arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${path}"/>
      </svg>
    </div>
    <span class="photo__hint">${hint}</span>
  `;
}

function renderStep(direction = 'forward') {
  const route = ROUTES[state.terminal];
  const step = route.steps[state.stepIdx];
  const total = route.steps.length;

  // Progress bars
  els.progressSteps.innerHTML = Array.from({ length: total }, (_, i) =>
    `<span class="${i <= state.stepIdx ? 'active' : ''}"></span>`
  ).join('');

  els.stepCurrent.textContent = state.stepIdx + 1;
  els.stepTotal.textContent = total;
  els.stepTime.textContent = `~${step.time}`;
  els.stepInstruction.textContent = step.instruction;
  els.stepDetail.textContent = step.detail;

  els.stepPhoto.className = 'photo';
  els.stepPhoto.innerHTML = buildPhotoHTML(step, `Photo ${state.stepIdx + 1} of ${total}`);

  // Update Next button label/icon
  const isLast = state.stepIdx === total - 1;
  const labelEl = els.nextBtn.querySelector('.btn__label');
  const arrowSVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${isLast ? 'M5 12l5 5L20 7' : 'M5 12h14M13 6l6 6-6 6'}"/></svg>`;
  labelEl.textContent = isLast ? "I'm at the pickup spot" : "I see this — next";
  // Replace the trailing icon
  const oldIcon = els.nextBtn.querySelector('svg');
  if (oldIcon) oldIcon.outerHTML = arrowSVG;

  // Wire up call button to driver's phone
  if (state.booking?.driver?.phone) {
    els.callDriverBtn.href = `tel:${state.booking.driver.phone}`;
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
  const b = state.booking?.driver || {};

  els.pickupSpot.textContent = route.pickup.spot;
  els.pickupDetail.textContent = route.pickup.detail;

  els.driverName.textContent = b.name || 'Your driver';
  els.driverVehicle.textContent = b.car && b.plate ? `${b.car} · ${b.plate}` : '';
  els.driverAvatar.textContent = b.name ? initials(b.name) : '?';

  if (b.phone) {
    els.arrivedCallBtn.href = `tel:${b.phone}`;
  }

  // Live tracking link from Autocab
  if (state.booking?.trackingUrl) {
    let url = state.booking.trackingUrl;
    if (!/^https?:/i.test(url)) url = `https://${url}`;
    els.trackBtn.href = url;
    els.trackBtn.hidden = false;
  }

  // Pickup photo
  els.pickupPhoto.className = 'photo photo--pickup';
  if (route.pickup.photo) {
    els.pickupPhoto.innerHTML = `<img src="${route.pickup.photo}" alt="Pickup spot" />
      <span class="photo__hint">${route.pickup.spot}</span>`;
  } else {
    els.pickupPhoto.innerHTML = `
      <div class="photo--placeholder" aria-hidden="true"></div>
      <div class="photo__arrow" aria-hidden="true" style="background: var(--success);">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
      </div>
      <span class="photo__hint">${route.pickup.spot}</span>
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
    // Very old browser fallback — show as plain block
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
    showDialogError('Please enter a phone number or a message.');
    return;
  }
  if (phone && !isValidPhone(phone)) {
    showDialogError('Please enter a valid phone number.');
    return;
  }

  setLoading(els.dialogSubmit, true);
  try {
    await api.requestCallback({
      bookingId: state.bookingId,
      phone,
      message
    });
    // Populate preview and swap to success view (user closes manually)
    els.previewPhone.textContent = phone || '—';
    els.previewMessage.textContent = message || '—';
    els.previewPhoneRow.hidden = !phone;
    els.previewMessageRow.hidden = !message;
    els.dialogFormView.hidden = true;
    els.dialogSuccessView.hidden = false;
  } catch (err) {
    showDialogError("Couldn't send right now. Please try again or call us directly.");
  } finally {
    setLoading(els.dialogSubmit, false);
  }
}

function showDialogError(msg) {
  els.dialogError.textContent = msg;
  els.dialogError.hidden = false;
}

function isValidPhone(p) {
  // Loose validation: at least 7 digits, allow + spaces hyphens
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
   tracking link, contact bar) when the customer has no booking.
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
    els.pickerEyebrow.textContent = 'Browse the pickup guide';
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
   Backend client and view-switching layer used by app.js.

     - api.getBooking({id})        → driver details + tracking link
     - api.requestCallback({...})  → callback / message request
     - showView(name)              → swap the visible <section>

   API_BASE — your backend's URL ('' = same origin).
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
  }
};

/* ============================================================
   View management
   Reads `els.views` and `state.view` defined in app.js.
============================================================ */
function showView(name) {
  Object.entries(els.views).forEach(([key, el]) => { el.hidden = (key !== name); });
  state.view = name;
  window.scrollTo({ top: 0 });
}
