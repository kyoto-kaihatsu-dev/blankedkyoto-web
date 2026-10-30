/*
 * BLANKED KYOTO – OpenAI Ads Measurement Pixel
 * Spec: "予約ページ遷移 コンバージョン計測設計 手順書" v1.0 (2026-10-26)
 *
 * Loaded in <head> of every page, before anything else.
 *
 * Events
 *   page_viewed        standard   every page
 *   booking_page_view  custom     booking.html / en/booking.html (main CV)
 *   booking_site_click custom     clicks on [data-booking-site] (reference only)
 *   appointment_scheduled standard thanks.html / en/thanks.html (booking completed, phase 2)
 *
 * Consent
 *   The SDK drops (does not queue) events while consent is false, so we
 *   keep our own tiny queue and replay page-level events once the visitor
 *   accepts. Consent is persisted by the SDK itself (localStorage + cookie,
 *   30 days), and mirrored in localStorage key "bk_consent" for the banner.
 *
 * Config
 *   window.BK_OAIQ = { pixelId: "...", debug: false }   (set in head before this file)
 */
(function (w, d) {
  'use strict';

  var cfg = w.BK_OAIQ || {};
  var PIXEL_ID = cfg.pixelId || '';
  var DEBUG = !!cfg.debug;
  var CONSENT_KEY = 'bk_consent'; // "granted" | "denied"
  var SDK_SRC = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';

  if (!PIXEL_ID || PIXEL_ID.indexOf('<') === 0) {
    if (DEBUG && w.console) console.warn('[bk-oaiq] pixelId not configured; measurement disabled');
    w.BK_OAIQ_STATE = { enabled: false };
    return;
  }

  /* ---------- 1. SDK stub + loader (spec 3.2) ---------- */
  if (!w.oaiq) {
    var q = function () { q.q.push(arguments); };
    q.q = [];
    w.oaiq = q;
    var js = d.createElement('script');
    js.async = true;
    js.src = SDK_SRC;
    var f = d.getElementsByTagName('script')[0];
    if (f && f.parentNode) f.parentNode.insertBefore(js, f); else d.head.appendChild(js);
  }

  /* ---------- 2. Consent first, then init (spec 3.5) ---------- */
  function storedConsent() {
    try { return w.localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  var consent = storedConsent(); // null = not decided yet
  var granted = consent === 'granted';

  w.oaiq('consent', granted);              // deny by default until the visitor decides
  var initOpts = { pixelId: PIXEL_ID };
  if (DEBUG) initOpts.debug = true;
  w.oaiq('init', initOpts);

  /* ---------- 3. Our own replay queue for page-level events ---------- */
  var pending = [];
  function fire(name, data, opts) {
    if (granted) {
      w.oaiq('measure', name, data, opts);
    } else {
      pending.push([name, data, opts]);
    }
  }
  function flush() {
    while (pending.length) {
      var ev = pending.shift();
      w.oaiq('measure', ev[0], ev[1], ev[2]);
    }
  }

  /* ---------- 4. Page-level events ---------- */
  var path = (w.location && w.location.pathname) || '';
  var isBooking = /(^|\/)booking\.html$/.test(path);

  var isThanks = /(^|\/)thanks\.html$/.test(path);

  fire('page_viewed', { type: 'contents' });
  if (isBooking) {
    // Main conversion: fires on page view, not on click (spec 3.3)
    fire('custom', { type: 'custom' }, { custom_event_name: 'booking_page_view' });
  }
  if (isThanks) {
    // Booking completed (spec 2.2, phase 2). One event per browser session:
    // a stable event_id lets the server dedupe reloads of the thanks page.
    var eid = null;
    try { eid = w.sessionStorage.getItem('bk_appt_eid'); } catch (e) {}
    if (!eid) {
      eid = 'appt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      try { w.sessionStorage.setItem('bk_appt_eid', eid); } catch (e) {}
    }
    fire('appointment_scheduled', { type: 'customer_action' }, { event_id: eid });
  }

  /* ---------- 5. Outbound booking-site clicks (spec 3.4) ---------- */
  d.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-booking-site]') : null;
    if (!el || !granted) return;
    w.oaiq('measure', 'custom', { type: 'custom' }, { custom_event_name: 'booking_site_click' });
  }, { passive: true });

  /* ---------- 6. Public API for the consent banner ---------- */
  w.BK_OAIQ_STATE = {
    enabled: true,
    consent: consent,
    grant: function () {
      if (granted) return;
      granted = true;
      try { w.localStorage.setItem(CONSENT_KEY, 'granted'); } catch (e) {}
      w.oaiq('consent', true);
      flush();
      w.BK_OAIQ_STATE.consent = 'granted';
    },
    deny: function () {
      granted = false;
      pending.length = 0;
      try { w.localStorage.setItem(CONSENT_KEY, 'denied'); } catch (e) {}
      w.oaiq('consent', false);
      w.BK_OAIQ_STATE.consent = 'denied';
    }
  };
})(window, document);
