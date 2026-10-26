/*
 * BLANKED KYOTO – measurement consent banner
 * Shows once until the visitor accepts or declines. Drives BK_OAIQ_STATE.
 */
(function (w, d) {
  'use strict';
  var st = w.BK_OAIQ_STATE;
  if (!st || !st.enabled || st.consent) return; // disabled or already decided

  var en = (d.documentElement.lang || 'ja').toLowerCase().indexOf('en') === 0;
  var t = en ? {
    text: 'We use measurement cookies to understand how visitors reach our booking page and to improve our advertising. No personal data is collected.',
    policy: 'Privacy policy',
    policyHref: '/en/privacy.html',
    accept: 'Accept',
    decline: 'Decline',
    label: 'Cookie consent'
  } : {
    text: '当サイトでは、広告の効果測定のため、予約ページへの到達状況を計測するCookieを使用します。氏名やメールアドレスなどの個人情報は取得しません。',
    policy: 'プライバシーポリシー',
    policyHref: '/privacy.html',
    accept: '同意する',
    decline: '同意しない',
    label: 'Cookieの利用に関する同意'
  };

  var box = d.createElement('div');
  box.className = 'consent';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', t.label);
  box.innerHTML =
    '<p class="consent-text">' + t.text + ' <a href="' + t.policyHref + '">' + t.policy + '</a></p>' +
    '<div class="consent-actions">' +
      '<button type="button" class="consent-btn consent-decline">' + t.decline + '</button>' +
      '<button type="button" class="consent-btn consent-accept">' + t.accept + '</button>' +
    '</div>';

  function close() { if (box.parentNode) box.parentNode.removeChild(box); }
  box.querySelector('.consent-accept').addEventListener('click', function () { st.grant(); close(); });
  box.querySelector('.consent-decline').addEventListener('click', function () { st.deny(); close(); });

  function mount() { d.body.appendChild(box); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount); else mount();
})(window, document);
