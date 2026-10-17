/*
 * BLANKED KYOTO – CTA click tracking
 *
 * Pushes a `cta_click` event to window.dataLayer for every click on an element
 * carrying a data-cta attribute (booking_jalan, booking_viator, booking_klook,
 * tel, instagram, map, online_store, ...).
 *
 * GTM setup (one-time):
 *   Trigger : Custom Event  – event name "cta_click"
 *   Tag     : GA4 Event     – event name {{Event}} / params cta_name, cta_language
 *   Variables: Data Layer Variable "cta_name", "cta_language"
 *
 * Until the GTM tag exists, the same event is also sent via gtag() when GA4 is
 * loaded directly on the page. The `window.__BK_GTM_GA4__ = true` flag (set in
 * GTM via a Custom HTML tag, or by removing the gtag snippet from the page)
 * disables the fallback so events are never double counted.
 */
(function () {
  'use strict';

  var lang = (document.documentElement.lang || 'ja').toLowerCase();

  function send(name, el) {
    var payload = {
      event: 'cta_click',
      cta_name: name,
      cta_language: lang,
      cta_href: el.getAttribute('href') || '',
      cta_text: (el.textContent || '').trim().slice(0, 80)
    };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    if (!window.__BK_GTM_GA4__ && typeof window.gtag === 'function') {
      window.gtag('event', 'cta_click', {
        cta_name: name,
        cta_language: lang,
        cta_href: payload.cta_href
      });
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-cta]') : null;
    if (!el) return;
    var name = el.getAttribute('data-cta');
    if (!name) return;
    send(name, el);
  }, { passive: true });
})();
