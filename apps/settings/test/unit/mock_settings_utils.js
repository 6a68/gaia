define(function() {
  'use strict';

  var MockSettingsUtils = {
    openDialog: function(dialogID, userOptions) {},
    loadTemplate: function(templatePanelId, callback) {
      callback();
    },
    runHeaderFontFit: function(header) {}
  };

  return MockSettingsUtils;
});
