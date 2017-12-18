'use strict';
//
// Replace /\b(const|let)\B/ with "$1 "
// Replace [/^( *)function (\w+)/] with [$1var $2 = function]
// Replace [/\Bof\s*/] With [ of ]
//
// Author: adrian.aichner@gmail.com
//
// Firefox Addon Content Script.
// require is not available in content scripts.
// let sp = require('sdk/simple-prefs');
// (function() {
let DEBUG_ADDON = true;

DEBUG_ADDON && console.log('document.readyState', document.readyState);

document.addEventListener('readystatechange', function (event) {
  DEBUG_ADDON && console.log('document.readyState', document.readyState);
  if (document.readyState == 'complete') {
    DEBUG_ADDON && console.log('document.readyState', document.readyState);
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      DEBUG_ADDON && console.log(message, sender);
      switch (message.type) {

      case 'load_editMdn': {
        try {
          let toggleSource = document.querySelector('#cke_15.cke_button__source');
          if (!toggleSource) {
            window.alert(`Source toggle button is ${toggleSource}`);
          }
          DEBUG_ADDON && console.log('toggleSource', toggleSource);
          if (toggleSource) {
            toggleSource.click();
            let sourceTags = document.querySelector('.tagit-new>input');
            let sourceTextarea = document.querySelector('textarea.cke_source.cke_editable');
            let commaEvent = new KeyboardEvent('keydown', {
              'keyCode': KeyEvent.DOM_VK_COMMA,
              'which': KeyEvent.DOM_VK_COMMA,
              'target': sourceTags,
              key: ',',
              code: 'Comma',
              target: sourceTags
            });
            if (sourceTextarea && sourceTags) {
              sourceTextarea.value = message.source + sourceTextarea.value;
              message.tags.forEach(function (tag) {
                sourceTags.value = `${tag}`;
                sourceTags.dispatchEvent(commaEvent);
              });
            }
          }
        }
        catch (e) {
          DEBUG_ADDON && console.log('exception', JSON.stringify(e, Object.keys(e), 2), e.toString());
        }
        break;
      }

      default: return false;
        
      }
    });
    browser.runtime.sendMessage({
      type: 'request_editMdn'
    });
  }
});
