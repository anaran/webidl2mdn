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
    // tab.close();
    console.log('on ready', tab.index, tab.title, tab.readyState, tabs.length);
    // for (let tab of tabs) {
    //   console.log(tab.title, tab.readyState);
    // }
    // if (tabs.length == 2) {
    //   tabs[tabs.length - 1].close();
    // }
    // tabs.activeTab.close();
  });
  tabs.on('activate', function (tab) {
    console.log('on activate', tab.index, tab.title, tab.readyState, tabs.length);
    // if (tabs.length == 2) {
    //   tabs[tabs.length - 1].close();
    // }
    // tabs.activeTab.close();
  });
  tabs.on('load', function (tab) {
    console.log('on load', tab.index, tab.title, tab.readyState, tabs.length);
    if (tab.index == 1 && tab.readyState == 'complete') {
      tabs[tab.index].close();
      main({text: text, callback: callback});
    }
    // tabs.activeTab.close();
  });
  tabs.activeTab.url = tree2URL;
  // tabs.open({
  //   // inNewWindow: true,
  //   url: tree2URL,
  //   onReady: function (tab) {
  //     tab.close();
  //   }
  // });
}

exports.dummy = dummy;

function main(options) {
  let tree = WebIDL2.parse("dictionary InstallParameters {\n sequence<DOMString> receipts = [];\n sequence<DOMString> categories = [];\n};");
  DEBUG_ADDON && console.log(JSON.stringify(tree, null, 2));
  // 'https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/9e0a50d547065bda8085aca4df835e8f07f76400/Apps.webidl';
  // 'https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/165d8bf251575cba1fe8412554b0b1d9d3488ce8/Apps.webidl';
  // 'https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/45712598504d8030d42b7c86dd4eed4593c0d7b6/Apps.webidl';
  // 'https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/61e8306fb27351a07e1e51d820ccdec47e4c0b1f/Apps.webidl';
  // 'https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/0a821d937303c732ec2efdf85e207a4f046774d1/Apps.webidl';
  // 'http://mxr.mozilla.org/mozilla-central/source/dom/webidl/Apps.webidl?raw=1';
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
              try {
                let package = require('./package.json');
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