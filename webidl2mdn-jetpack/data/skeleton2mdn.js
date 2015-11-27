;
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
let DEBUG_ADDON = false;

typeof document != 'undefined' && document.addEventListener('readystatechange', function (event) {
  DEBUG_ADDON && console.log('document.readyState', document.readyState);
  if (document.readyState == 'complete') {
    // self is undefined when using require in jpm test.
    (typeof self !== 'undefined') && self.port.on('load_editMdn', function(data) {
      try {
        let toggleSource = document.getElementById('cke_14');
        console.log('toggleSource', toggleSource);
        if (toggleSource) {
          toggleSource.click();
          let sourceTextarea = document.querySelector('textarea.cke_source.cke_editable');
          let sourceTags = document.querySelector('.tagit-new>input');
          if (sourceTextarea && sourceTags) {
            sourceTextarea.value = data.source + sourceTextarea.value;
            data.tags.forEach(function (tag) {
              sourceTags.focus();
              sourceTags.value = tag;
              sourceTags.blur();
            });
          }
        }
      }
      catch (e) {
        console.log('exception', JSON.stringify(e, Object.keys(e), 2), e.toString());
      }
    });
    // self is undefined when using require in jpm test.
    (typeof self !== 'undefined') && self.port.emit('request_editMdn');
    // })();
  }
});
