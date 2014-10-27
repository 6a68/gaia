/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* global SettingsHelper, FxaModuleManager, MozActivity */

'use strict';

/*
 * FxModuleServerRequest wraps the functionality exposed by the server,
 * letting our code to be shielded against changes in the API of FxA.
 */

(function(exports) {

  function _setAccountDetails(response) {
    if(response && response.user && response.user.email) {
      FxaModuleManager.setParam('done', true);
      FxaModuleManager.setParam('verified', response.user.verified);
    }
  }

  function _ensureFxaClient(callback) {
    window.parent.LazyLoader.load('../js/fxa_client.js', function() {
      callback && callback();
    });
  }

  function _loadExternalURL(url, onerror) {
    var activity = new MozActivity({
      name: 'view',
      data: {
        type: 'url',
        url: url
      }
    });
    activity.onsuccess = function on_load_external_link_success() {
      // When the browser loads, it is *behind* the system app. So we
      // need to dismiss this app in order to let the user reset their
      // password or view the privacy/terms-of-service pages.
      FxaModuleManager.close();
    };
    activity.onerror = function on_load_external_link_error(err) {
      console.error(err);
      onerror && onerror(err);
    };
  }

  var FxModuleServerRequest = {
    checkEmail: function fxmsr_checkEmail(email, onsuccess, onerror) {
      _ensureFxaClient(function() {
        window.parent.FxAccountsClient.queryAccount(
                email,
                onsuccess,
                onerror);
      });
    },
    signIn: function fxmsr_signIn(email, password, onsuccess, onerror) {

      function successHandler(response) {
        _setAccountDetails(response);
        var authenticated =
          (response && response.user && response.user.verified) || false;
        onsuccess && onsuccess({
          authenticated: authenticated
        });
      }

      function errorHandler(response) {
        onerror && onerror(response);
      }

      _ensureFxaClient(function signIn() {
        window.parent.FxAccountsClient.signIn(
                email,
                password,
                successHandler,
                errorHandler);
      });

    },
    signUp: function fxmsr_signUp(email, password, onsuccess, onerror) {
      function successHandler(response) {
        _setAccountDetails(response);
        onsuccess && onsuccess(response);
      }

      _ensureFxaClient(function signUp() {
         window.parent.FxAccountsClient.signUp(
                email,
                password,
                successHandler,
                onerror);
      });
    },
    requestPasswordReset:
      function fxmsr_requestPasswordReset(email, onerror) {
      var pref = 'identity.fxaccounts.reset-password.url';
      SettingsHelper(pref).get(function(url) {
        if (!url) {
          return console.error('Failed to load ' + pref);
        }
        if (email) {
          url += '?email=' + email;
        }
        _loadExternalURL(url, onerror);
      });
    },
    loadTermsURL: function fxmsr_loadTermsURL() {
      var pref = 'identity.fxaccounts.terms.url';
      SettingsHelper(pref).get(function(url) {
        url ? _loadExternalURL(url) : console.error('Failed to load ' + pref);
      });
    },
    loadPrivacyURL: function fxmsr_loadPrivacyURL() {
      var pref = 'identity.fxaccounts.privacy.url';
      SettingsHelper(pref).get(function(url) {
        url ? _loadExternalURL(url) : console.error('Failed to load ' + pref);
      });
    }
  };
  exports.FxModuleServerRequest = FxModuleServerRequest;
}(window));
