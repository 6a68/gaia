/* global FxAccountsDialog, FtuLauncher */

'use strict';

var FxAccountsUI = {
  dialog: null,
  panel: null,
  iframe: null,
  onerrorCb: null,
  onsuccessCb: null,
  popup: null,

  init: function init() {
    var dialogOptions = {
      onHide: this.reset.bind(this)
    };
    if (!this.dialog) {
      this.dialog = new FxAccountsDialog(dialogOptions);
    }
    this.panel = this.dialog.getView();
    this.iframe = document.createElement('iframe');
    this.iframe.id = 'fxa-iframe';
    window.addEventListener('home', function() {
      console.log('fxa_ui caught "home" event');
    });
    window.addEventListener('holdhome', function() {
      console.log('fxa_ui caught "holdhome" event');
    });
    window.addEventListener('activityrequesting', function() {
      console.log('fxa_ui caught "activityrequesting" event');
    });
  },

  // assumed bound to 'this'
  _closePopup: function fxa_ui_close_popup() {
    window.removeEventListener('activityrequesting', this._closePopup);
    window.removeEventListener('home', this._closePopup);
    window.removeEventListener('holdhome', this._closePopup);
    this.popup && this.popup.requestClose();
  },

  // Sign in/up flow.
  login: function fxa_ui_login(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('login');
  },

  // Logout flow.
  logout: function fxa_ui_logout(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('logout');
  },

  // Delete flow.
  delete: function fxa_ui_delete(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('delete');
  },

  // Refresh authentication flow.
  refreshAuthentication: function fxa_ui_refreshAuth(email,
                                                     onsuccess,
                                                     onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('refresh_auth', ['email=' + email]);
  },

  // Method which close the dialog.
  close: function fxa_ui_close() {
    var self = this;
    this.panel.addEventListener('animationend', function closeAnimationEnd() {
      self.panel.removeEventListener('animationend', closeAnimationEnd, false);
      self.panel.classList.remove('closing');
      self.dialog.hide();
    }, false);
    this.panel.classList.add('closing');
  },

  // Method for reseting the panel.
  reset: function fxa_ui_reset(reason) {
    this.panel.removeChild(this.iframe);
    this.dialog.browser = null;
    if (reason == 'home' || reason == 'holdhome') {
      this.onerrorCb && this.onerrorCb('DIALOG_CLOSED_BY_USER');
    }
    this.onerrorCb = null;
    this.onsuccessCb = null;
  },

  // Method for loading the iframe with the flow required.
  loadFlow: function fxa_ui_loadFlow(flow, params) {
    var url = '../fxa/fxa_module.html#' + flow;
    if (FtuLauncher.isFtuRunning()) {
      params = params || [];
      params.push('isftu=true');
    }
    if (params && Array.isArray(params)) {
      url += '?' + params.join('&');
    }
    this.iframe.setAttribute('src', url);
    this.panel.appendChild(this.iframe);
    this.dialog.browser = { element: this.iframe };
    this.dialog.show();
  },

  // Method for sending the result of the FxAccounts flow to the caller app.
  done: function fxa_ui_done(data) {
    // Proccess data retrieved.
    this.onsuccessCb && this.onsuccessCb(data);
    this.close();
  },

  error: function fxa_ui_error(error) {
    this.onerrorCb && this.onerrorCb(error);
    this.close();
  },

  openPopup: function fxa_ui_open_popup(url) {
    if (this.popup) {
      // TODO should this ever occur?
      console.log('fxaUI.openPopup called, yet this.popup already exists');
    }
    this.popup = new window.PopupWindow({url: url});
    this.popup.requestOpen();
    window.addEventListener('activityrequesting', this._closePopup.bind(this));
    window.addEventListener('home', this._closePopup.bind(this));
    window.addEventListener('holdhome', this._closePopup.bind(this));
    // close the dialog and tell the RP the user closed it
    this.error('DIALOG_CLOSED_BY_USER');
  }
};

// this injects code into HTML and we need it to be localized
navigator.mozL10n.once(FxAccountsUI.init.bind(FxAccountsUI));
