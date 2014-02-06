/* global FxAccountsIACHelper, FxaMenu, LazyLoader */

'use strict';

navigator.mozL10n.ready(function loadWhenIdle() {
  var idleObserver = {
    time: 4,
    onidle: function() {
      // don't load scripts if we have been preffed off
      var displayPref = '[data-show-name="identity.fxaccounts.ui.enabled"]';
      if (document.querySelector(displayPref).hidden) {
        return;
      }
      navigator.removeIdleObserver(idleObserver);
      LazyLoader.load([
        '/shared/js/fxa_iac_client.js',
        '/shared/js/text_normalizer.js',
        'js/firefox_accounts/menu.js'
      ], function fxa_menu_loaded() {
        FxaMenu.init(FxAccountsIACHelper);
      });
    }
  };
  navigator.addIdleObserver(idleObserver);
});
