/*
 * BLANKED KYOTO – CTA click tracking
 *
 * Sends a `cta_click` event directly via gtag() for every click on an element
 * carrying a data-cta attribute (booking_jalan, booking_viator, booking_klook,
 * tel, instagram, map, online_store, ...), with cta_name, cta_language and
 * cta_href as event parameters.
 *
 * History / why direct-only (fixed 2026-11-07):
 *   This script used to also push the event to window.dataLayer. GTM container
 *   GTM-NZFVBWSF contains a generic GA4 event tag (part of a Meta Conversions
 *   API template set) that forwards every dataLayer custom event to GA4, but
 *   without the cta_* parameters — so each click was counted multiple times
 *   and almost all events showed cta_name as (not set). The dataLayer push was
 *   removed so gtag() is the single path for cta_click. Likewise, page_view is
 *   sent only by the gtag('config') in each page's <head>; the Google tag in
 *   GTM has send_page_view disabled so nothing is double counted.
 *
 * ChatGPT Ads (OpenAI Measurement Pixel): clicks on booking CTAs (data-cta
 * starting with "booking") also fire oaiq("measure", "appointment_scheduled")
 * as the conversion event, because bookings complete on external sites
 * (Jalan / JapanTicket / Klook / Viator) where the pixel cannot run. The
 * pixel base code is in each page's <head>; the conversion event must be
 * defined in ChatGPT Ads Manager against the "appointment_scheduled" event.
 */
(function () {
  'use strict';

  var lang = (document.documentElement.lang || 'ja').toLowerCase();

  function send(name, el) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'cta_click', {
        cta_name: name,
        cta_language: lang,
        cta_href: el.getAttribute('href') || ''
      });
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-cta]') : null;
    if (!el) return;
    var name = el.getAttribute('data-cta');
    if (!name) return;
    send(name, el);
    if (name.indexOf('booking') === 0 && typeof window.oaiq === 'function') {
      window.oaiq('measure', 'appointment_scheduled', { type: 'customer_action' });
    }
  }, { passive: true });
})();
