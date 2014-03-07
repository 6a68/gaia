/* global SystemDialog */

'use strict';

var FxAccountsUI = {
  dialog: null,
  panel: null,
  onerrorCb: null,
  onsuccessCb: null,

  init: function init() {
    var dialogOptions = {
      onHide: this.reset.bind(this)
    };
    this.dialog = SystemDialog('fxa-dialog', dialogOptions);
    this.panel = document.getElementById('fxa-dialog');
    this.iframe = document.createElement('iframe');
    this.iframe.id = 'fxa-iframe';
  },

  // Sign in/up flow.
  // XXX callerApp is an optional third parameter, if it is present then
  //     we pass it along to the fxa system app (via window.open params?)
  login: function fxa_ui_login(onsuccess, onerror, callerApp) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('login', callerApp);
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
  refreshAuthentication: function fxa_ui_refreshAuth(accountId,
                                                     onsuccess,
                                                     onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('refresh_auth', ['accountId=' + accountId]);
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
  reset: function fxa_ui_reset() {
    this.panel.innerHTML = '';
    this.onerrorCb = null;
    this.onsuccessCb = null;
  },

  // Method for loading the iframe with the flow required.
  loadFlow: function fxa_ui_loadFlow(flow, params) {
    var url = '../fxa/fxa_module.html#' + flow;
    if (params && Array.isArray(params)) {
      url += '?' + params.join('&');
    }
    this.iframe.setAttribute('src', url);
    this.panel.appendChild(this.iframe);
/* leaving the unresolved conflict so I can ponder it 
<<<<<<< HEAD
=======
    // XXX this is not actually reliable, we should use a parameter passed into
    //     loadFlow to tell us which app called the fxa app
    //     maybe something like making params an object and looking for
    //     params.callerApp == 'ftu'
    if (FtuLauncher.isFtuRunning()) {
      this.panel.classList.add('isFTU');
    } else {
      this.panel.classList.remove('isFTU');
    }
>>>>>>> 43e4f74... WIP commit with spots where we need to pass app name
    this.dialog.show();
*/
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
  }
};

FxAccountsUI.init();
