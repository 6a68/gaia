/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* global FxaModuleStates, FxaModuleUI, FxaModule, FxaModuleNavigation,
   FxModuleServerRequest, FxaModuleOverlay, FxaModuleManager */
/* exported FxaModuleEnterEmail */

'use strict';

/**
 * This module checks the validity of an email address, and if valid,
 * determines which screen to go next.
 */

var FxaModuleEnterEmail = (function() {

  var _ = null;
  var localize = null;

  function _isEmailValid(emailEl) {
    return emailEl && emailEl.value && emailEl.validity.valid;
  }

  function _loadSignIn(done) {
    done(FxaModuleStates.ENTER_PASSWORD);
  }

  function _loadCoppa(done) {
    done(FxaModuleStates.COPPA);
  }

  function _enableNext(emailEl) {
    if (_isEmailValid(emailEl)) {
      FxaModuleUI.enableNextButton();
    } else {
      FxaModuleUI.disableNextButton();
    }
  }

  var Module = Object.create(FxaModule);
  Module.init = function init() {
    _ = navigator.mozL10n.get;
    localize = navigator.mozL10n.localize;


    // Blocks the navigation until check the condition
    _enableNext(this.fxaEmailInput);

    if (this.initialized) {
      return;
    }

    // Cache HTML elements
    this.importElements(
      'fxa-email-input',
      'fxa-notice',
      'fxa-terms',
      'fxa-privacy'
    );

    // build up the TOS/PN string
    // TODO: this works but is ugly. is innerHTML a lesser evil?
    while (this.fxaNotice.firstChild) {
      this.fxaNotice.removeChild(this.fxaNotice.firstChild);
    }
    localize(this.fxaTerms, 'fxa-terms-of-service');
    localize(this.fxaPrivacy, 'fxa-privacy-notice');
    var fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode(_('fxa-notice-1') + ' '));
    fragment.appendChild(this.fxaTerms);
    fragment.appendChild(document.createTextNode(' ' + _('fxa-and') + ' '));
    fragment.appendChild(this.fxaPrivacy);
    fragment.appendChild(document.createTextNode(' ' + _('fxa-notice-2')));
    this.fxaNotice.appendChild(fragment);

    // Add listeners
    this.fxaEmailInput.addEventListener(
      'input',
      function onInput(event) {
        _enableNext(event.target);
      }
    );
    // Ensure that pressing 'ENTER' (keycode 13) we send the form
    // as expected
    this.fxaEmailInput.addEventListener(
      'keypress',
      function onKeypress(event) {
        if (_isEmailValid(this.fxaEmailInput) && event.keyCode === 13) {
          document.activeElement.blur();
          FxaModuleNavigation.next();
        }
      }.bind(this)
    );

    // Avoid to add listener twice
    this.initialized = true;
  };

  Module.onNext = function onNext(gotoNextStepCallback) {
    FxaModuleOverlay.show(_('fxa-connecting'));

    var email = this.fxaEmailInput.value;

    FxModuleServerRequest.checkEmail(
      email,
      function onSuccess(response) {
        FxaModuleOverlay.hide();
        FxaModuleManager.setParam('email', email);
        if (response && response.registered) {
          _loadSignIn(gotoNextStepCallback);
        } else {
          _loadCoppa(gotoNextStepCallback);
        }
      },
      this.showErrorResponse);
  };

  Module.onBack = function onBack() {
    FxaModuleUI.enableNextButton();
  };

  return Module;

}());

