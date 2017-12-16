'use strict';
let DEBUG_ADDON = true;

DEBUG_ADDON && console.log(document.location, document.readyState);
DEBUG_ADDON && console.trace();
DEBUG_ADDON && console.log('How about local copy of https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/1c3e06eaf70562bd2db80c056d5aaef6b18208c4/Apps.webidl due to X-Frame-Options: deny?');
if (document.body.firstElementChild) {
  browser.runtime.sendMessage({
    type: 'request_AST',
    url: document.URL,
    src: document.body.textContent
  }).then(res => {
    DEBUG_ADDON && console.log(res);
  }).catch(err => {
    DEBUG_ADDON && console.log(err);
  });
}
