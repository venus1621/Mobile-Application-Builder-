/**
 * Android WebView (Capacitor) often delivers touch to <input> but not synthetic click on <button>.
 * Add BEFORE your main <script> block, or right after <body>:
 *   <script src="/path/to/pwa-webview-touch-fix.js"></script>
 *
 * Or paste this file contents into an inline <script> at end of body.
 */
(function () {
  if (window.__capacitorWebViewTouchFix) return;
  window.__capacitorWebViewTouchFix = true;

  var style = document.createElement('style');
  style.textContent =
    'button,.btn,[role="button"],.auth-tab,.nav-tab,.icon-btn,.see-all,.tip-opt,.cat-chip,' +
    '.food-add-btn,.qty-btn,.star-btn,.menu-load-more-btn,.issue-chip,.profile-row,.address-option,' +
    '.rest-card,.order-hist-card,.address-bar,.menu-item-row,.cart-conflict-actions button,.sheet-overlay .btn{' +
    'touch-action:manipulation;-webkit-user-select:none;user-select:none;}';

  document.head.appendChild(style);

  var sel =
    'button,a.btn,[role="button"],.auth-tab,.nav-tab,.icon-btn,.see-all,.tip-opt,.cat-chip,' +
    '.food-add-btn,.qty-btn,.star-btn,.menu-load-more-btn,.issue-chip,.profile-row,.address-option,' +
    '.rest-card,.order-hist-card,.address-bar,.menu-item-row,.cart-conflict-actions button';

  var startX;
  var startY;
  var targetEl;

  document.addEventListener(
    'touchstart',
    function (e) {
      if (e.touches.length !== 1) {
        targetEl = null;
        return;
      }
      var t = e.target.closest && e.target.closest(sel);
      if (!t || t.disabled) {
        targetEl = null;
        return;
      }
      var tag = t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        targetEl = null;
        return;
      }
      targetEl = t;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true, capture: true }
  );

  document.addEventListener(
    'touchend',
    function (e) {
      if (!targetEl || e.changedTouches.length !== 1) return;
      var x = e.changedTouches[0].clientX;
      var y = e.changedTouches[0].clientY;
      if (Math.abs(x - startX) > 18 || Math.abs(y - startY) > 18) {
        targetEl = null;
        return;
      }
      var el = targetEl;
      targetEl = null;
      if (typeof el.click === 'function') {
        el.click();
      }
      e.preventDefault();
    },
    { passive: false, capture: true }
  );
})();
