let DEBUG_ADDON = false;
let self = require('sdk/self');
let tabs = require('sdk/tabs');
let XMLHttpRequest = require("sdk/net/xhr").XMLHttpRequest;
let xhr = new XMLHttpRequest();
let WebIDL2 = require("webidl2");
let tree2URL = 
    'https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/1c3e06eaf70562bd2db80c056d5aaef6b18208c4/Apps.webidl';

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  tabs.on('ready', function (tab) {
    DEBUG_ADDON && console.log('on ready', tab.index, tab.title, tab.readyState, tabs.length);
  });
  tabs.on('activate', function (tab) {
    DEBUG_ADDON && console.log('on activate', tab.index, tab.title, tab.readyState, tabs.length);
  });
  tabs.on('load', function (tab) {
    DEBUG_ADDON && console.log('on load', tab.index, tab.title, tab.readyState, tabs.length);
    if (tab.index == 1 && tab.readyState == 'complete') {
      // The skeleton page load is complete, so we can close what would be
      // an unexpected tab for the test suite.
      tabs[tab.index].close();
      // Finally run a simple parse without opening tabs and terminate
      // by calling callback(text) as expected by test suite.
      main({text: text, callback: callback});
    }
  });
  // Test loading a passinng reference .webidl file
  // This should open a second tab with the skeleton (current only an overview page)
  tabs.activeTab.url = tree2URL;
}

exports.dummy = dummy;

function main(options) {
  let tree = WebIDL2.parse("dictionary InstallParameters {\n sequence<DOMString> receipts = [];\n sequence<DOMString> categories = [];\n};");
  DEBUG_ADDON && console.log(JSON.stringify(tree, null, 2));
  xhr.open('GET', options.url || tree2URL);
  xhr.onload = options.onload || function() {
    if (this.readyState == xhr.DONE && xhr.responseText.length) {
      DEBUG_ADDON && console.log('xhr.responseText', xhr.responseText);
      try {
        let tree2 = WebIDL2.parse(xhr.responseText);
        DEBUG_ADDON && console.log(JSON.stringify(tree2, null, 2));
      }
      catch (e) {
        DEBUG_ADDON && console.log('exception', JSON.stringify(e, Object.keys(e), 2), e.toString());
        if (typeof options.callback == 'function') {
          options.callback(e.toString());
        }
      }
      if (typeof options.callback == 'function' && typeof options.text == 'string') {
        options.callback(options.text);
      }
    }
  };
  xhr.send();
}

let handleErrors = function (exception) {
  // FIXME: Perhaps this should open a styled error page and just
  // post error data to it.
  DEBUG_ADDON && console.log((JSON.stringify(exception,
                                             Object.getOwnPropertyNames(exception), 2)));
  // Opening a new tab open raises yet another error to handle ...
  return;
  let originallyActiveTab = tabs.activeTab;
  tabs.open({
    // inNewWindow: true,
    url: 'data:text/html;charset=utf-8,<html><head><title>' + myTitle
    + ' Error</title></head><body><h1>' + myTitle
    + ' Error</h1><pre>'
    + (JSON.stringify(exception,
                      Object.getOwnPropertyNames(exception), 2))
    .replace(/(:\d+)+/g, '$&\n')
    .replace(/->/g, '\n$&')
    .replace(/\n/g, '%0a')
    + '</pre>',
    onClose: function() {
      tabs.activeTab.activate();
    }});
};

tabs.on('load', function(tab) {
  DEBUG_ADDON && console.log('tab is loaded', tab.title, tab.url);
  try {
    let webidl2mdnTab, webidl2mdnWorker, skeletonMdnTab, skeletonMdnTabWorker;
    // let originallyActiveTab = tabs.activeTab;
    let originallyActiveTab = tab;
    if (!/\.webidl\b/.test(tab.url)) {
      return;
    }
    tabs.open({
      // inNewWindow: true,
      url: 'webidl2mdn.html',
      onReady: function(tab) {
        // DEBUG_ADDON && console.log('tab.url', tab.url, webidl2mdnTab.url, originallyActiveTab.url);
        webidl2mdnTab = tab;
        webidl2mdnWorker = tab.attach({
          contentScriptFile: [
            './webidl2skeleton.js',
            // './report-json-parse-error.js',
            // './diagnostics_overlay.js'
          ],
          onError: handleErrors
        });
        let emitLoadwebidl2mdn = function (data) {
          main({url: originallyActiveTab.url, onload: function () {
            if (this.readyState == xhr.DONE && xhr.responseText.length) {
              DEBUG_ADDON && console.log('xhr.responseText', xhr.responseText);
              let package = require('./package.json');
              try {
                let tree2 = WebIDL2.parse(xhr.responseText);
                DEBUG_ADDON && console.log(JSON.stringify(tree2, null, 2));
                webidl2mdnWorker.port.emit('load_webidl2mdn', {
                  generator: package.title,
                  icon: package.icon,
                  url: originallyActiveTab.url,
                  AST: tree2
                });
              }
              catch (e) {
                webidl2mdnWorker.port.emit('load_webidl2mdn', {
                  generator: package.title,
                  icon: package.icon,
                  url: originallyActiveTab.url,
                  exception: e
                });
                DEBUG_ADDON && console.log('exception', JSON.stringify(e, Object.keys(e), 2), e.toString());
              }
            }
          }});
        };
        let emitLoadSkeleton2Mdn = function (data) {
          let originallyActiveTab = tabs.activeTab;
          tabs.open({
            // inNewWindow: true,
            url: data.url,
            onReady: function (tab) {
              skeletonMdnTab = tab;
              skeletonMdnTabWorker = tab.attach({
                contentScriptFile: [
                  './skeleton2mdn.js',
                ],
                onError: handleErrors
              });
              let emitEditMdn = function () {
                skeletonMdnTabWorker.port.emit('load_editMdn', {
                  source: data.source,
                  tags: data.tags
                });
              };
              skeletonMdnTabWorker.port.on('request_editMdn', emitEditMdn);
            },
            onClose: function() {
              skeletonMdnTab = false;
              // NOTE: See https://bugzilla.mozilla.org/show_bug.cgi?id=1208499
              // let me = originallyActiveTab.index;
              for (let t of tabs) {
                if (t === originallyActiveTab) {
                  originallyActiveTab.activate();
                  break;
                }
              }
            }});
        };
        webidl2mdnWorker.port.on('request_webidl2mdn', emitLoadwebidl2mdn);
        webidl2mdnWorker.port.on('request_skeleton2mdn', emitLoadSkeleton2Mdn);
      },
      onClose: function() {
        webidl2mdnTab = false;
        // NOTE: See https://bugzilla.mozilla.org/show_bug.cgi?id=1208499
        // let me = originallyActiveTab.index;
        for (let t of tabs) {
          if (t === originallyActiveTab) {
            originallyActiveTab.activate();
            break;
          }
        }
      }});
  }
  catch (e) {
    DEBUG_ADDON && console.log('exception', JSON.stringify(e, Object.keys(e), 2), e.toString());
  }
});