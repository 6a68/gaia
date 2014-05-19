/* global Normalizer */
/* exported FxaPanel */

'use strict';

var FxaPanel = (function fxa_panel() {
  var fxaContainer,
    loggedOutPanel,
    loggedInPanel,
    unverifiedPanel,
    cancelBtn,
    loginBtn,
    logoutBtn,
    loggedInEmail,
    unverifiedEmail,
    fxaHelper;

  function init(fxAccountsIACHelper) {
    // allow mock to be passed in for unit testing
    fxaHelper = fxAccountsIACHelper;
    fxaContainer = document.getElementById('fxa');
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    unverifiedPanel = document.getElementById('fxa-unverified');
    cancelBtn = document.getElementById('fxa-cancel-confirmation');
    loginBtn = document.getElementById('fxa-login');
    logoutBtn = document.getElementById('fxa-logout');
    loggedInEmail = document.getElementById('fxa-logged-in-text');
    unverifiedEmail = document.getElementById('fxa-unverified-text');

    // listen for changes
    onVisibilityChange();
    // start by checking current status
    refreshStatus();
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      fxaHelper.removeEventListener('onlogin', refreshStatus);
      fxaHelper.removeEventListener('onverifiedlogin', refreshStatus);
      fxaHelper.removeEventListener('onlogout', refreshStatus);
    } else {
      fxaHelper.addEventListener('onlogin', refreshStatus);
      fxaHelper.addEventListener('onverifiedlogin', refreshStatus);
      fxaHelper.addEventListener('onlogout', refreshStatus);
    }
  }

  function refreshStatus() {
    fxaHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
  }

  // if e == null, user is logged out.
  // if e.verified, user is logged in & verified.
  // if !e.verified, user is logged in & unverified.
  function onFxAccountStateChange(e) {
    var email = e ? Normalizer.escapeHTML(e.email) : '';

    if (!e) {
      hideLoggedInPanel();
      hideUnverifiedPanel();
      showLoggedOutPanel();
    } else if (e.verified) {
      hideLoggedOutPanel();
      hideUnverifiedPanel();
      showLoggedInPanel(email);
    } else {
      hideLoggedOutPanel();
      hideLoggedInPanel();
      showUnverifiedPanel(email);
    }
  }

  function onFxAccountError(err) {
    console.error('FxaPanel: Error getting Firefox Account: ' + err.error);
  }

  function hideLoggedOutPanel() {
    loginBtn.onclick = null;
    loggedOutPanel.hidden = true;
  }

  function showLoggedOutPanel() {
    loginBtn.onclick = onLoginClick;
    loggedOutPanel.hidden = false;
  }

  function hideLoggedInPanel() {
    loggedInPanel.hidden = true;
    loggedInEmail.textContent = '';
    logoutBtn.onclick = null;
  }

  function showLoggedInPanel(email) {
    navigator.mozL10n.localize(loggedInEmail, 'fxa-logged-in-text', {
      email: email
    });
    loggedInPanel.hidden = false;
    logoutBtn.onclick = onLogoutClick;
  }

  function hideUnverifiedPanel() {
    unverifiedPanel.hidden = true;
    unverifiedEmail.textContent = '';
    cancelBtn.onclick = null;
  }

  function showUnverifiedPanel(email) {
    unverifiedPanel.hidden = false;
    cancelBtn.onclick = onCancelClick;
    navigator.mozL10n.localize(
      unverifiedEmail,
      'fxa-verification-email-sent-msg',
      {email: email}
    );
  }

  // require password to logout, otherwise find my device is pointless
  // XXX the console.logs have been inserted to try to trace the refreshAuth
  //     flow, which seems broken at the moment.
  function onLogoutClick(e) {
    e.stopPropagation();
    e.preventDefault();
    // we never cache the email. get it from gecko
    fxaHelper.getAccounts(function fxam_get_accounts_cb(resp) {
      console.error('getAccounts returned ok');
      var email = resp && resp.email;
      if (!email) {
        // if no email was found, we're logged out, so bail & refresh the UI.
        console.error('getAccounts returned but email was falsy');
        return refreshStatus();
      }
      // if they are logged in, ask them to re-enter password
      fxaHelper.refreshAuthentication(email, function fxam_refresh_auth_cb() {
        console.error('refreshAuthentication returned ok');
        fxaHelper.logout(onFxAccountStateChange, onFxAccountError);
      }, function fxam_refresh_auth_error() {
        // if they fail the challenge, let them try again, and log it.
        // TODO do we want to disable the logout button for a period of time?
        console.error('FxaPanel: User tried logout, failed password challenge');
      });
    }, function fxam_get_accounts_error(err) {
      // if we can't get accounts, just log the error and let them try again
      console.error('FxaPanel: Error getting Firefox Account: ' + err.error);
    });
  }

  // canceling an unverified account doesn't require re-authing
  function onCancelClick(e) {
    e.stopPropagation();
    e.preventDefault();
    fxaHelper.logout(onFxAccountStateChange, onFxAccountError);
  }

  function onLoginClick(e) {
    e.stopPropagation();
    e.preventDefault();
    fxaHelper.openFlow(onFxAccountStateChange, onFxAccountError);
  }

  return {
    init: init
  };

})();
