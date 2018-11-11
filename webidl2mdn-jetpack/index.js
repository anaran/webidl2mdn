'use strict';
let DEBUG_ADDON = true;

DEBUG_ADDON && console.log(document.location, document.readyState);
DEBUG_ADDON && console.trace();
DEBUG_ADDON && console.log('How about local copy of https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/1c3e06eaf70562bd2db80c056d5aaef6b18208c4/Apps.webidl due to X-Frame-Options: deny?');

let gist = document.querySelector('.gist-blob-name');
let src = "";
let api_name;
let matches = gist && gist.textContent.trim().match(/^(.+)\.webidl$/);

if (gist && matches[1]) {
  api_name = matches[1];
  Array.prototype.forEach.call(document.querySelectorAll('td.js-file-line'), (value) => {
    console.log(value.textContent);
    src += `${value.textContent}\n`;
  });
}
else if (document.contentType == 'text/plain') {
  let pre = document.querySelector('body>pre');
  api_name = document.URL.match(/([^\/]+)\.webidl\b/)[1];
  src = pre.textContent;
}

if (src.length) {
  browser.runtime.sendMessage({
    api_name: api_name,
    src: src,
    type: 'request_AST',
    url: document.URL,
  }).then(res => {
    DEBUG_ADDON && console.log(res);
  }).catch(err => {
    DEBUG_ADDON && console.log(err);
  });
}
