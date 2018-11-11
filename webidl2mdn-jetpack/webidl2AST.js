console.log(window.location, window.document.readyState);
// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log(message);
//   sendResponse({message: message, sender: sender});
// });
const WebIDL2 = window.WebIDL2;
let DEBUG_ADDON = true;
 
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {

  case 'request_skeleton2mdn': {
    browser.tabs.create({
      url: message.url
    }).then(tab => {
      browser.runtime.onMessage.addListener((message2, sender, sendResponse) => {
        switch (message2.type) {
        case 'request_editMdn': {
          browser.tabs.sendMessage(tab.id, {
            type: 'load_editMdn',
            source: message.source,
            tags: message.tags
          }).then(res => {
            console.log(res);
          }).catch(err => {
            console.log(err);
          });
          sendResponse(message);
          break;
        }
        }
      });
      browser.tabs.executeScript(
        tab.id,
        {
          file: 'data/skeleton2mdn.js'
        }).then(res => {
          console.log('executeScript leads', res, this);
        }).catch(err => {
          console.log('executeScript error', err);
        });
    });
    break;
  }

  case 'request_mdn_user_name': {
    browser.tabs.create({
      // Causes alert from github for unusual number of authorization requests
      // url: 'https://developer.mozilla.org/users/github/login/'
      url: 'https://developer.mozilla.org/'
    }).then(tab => {
      browser.tabs.executeScript(
        tab.id,
        {
          code: 'document.querySelector("span.login-name") && document.querySelector("span.login-name").textContent;'
        }
      ).then(res => {
        DEBUG_ADDON && console.log('res[0]', res[0]);
        sendResponse({ 'mdn_user_name': res[0] });
        browser.tabs.remove(tab.id);
      }).catch(err => {
        console.log('browser.tabs.executeScript error', err);
      });
    }).catch(err => {
      console.log('browser.tabs.create error', err);
    });
    return true;
    break;
  }

  case 'request_AST': {
    let AST;
    try {
      AST = WebIDL2.parse(message.src);
    }
    catch(e) {
      AST = e;
    }
      browser.tabs.create({
        url: 'data/webidl2mdn.html'
      }).then(tab => {
        browser.tabs.executeScript(
          tab.id,
          {
            file: 'data/webidl2skeleton.js'
          }
        ).then(res => {
          console.log('executeScript leads', res, this);
          const manifest = browser.runtime.getManifest();
          browser.tabs.sendMessage(tab.id, {
            AST: AST,
            api_name: message.api_name,
            generator: manifest.name,
            homepage: manifest.developer.url,
            icon: browser.extension.getURL(manifest.icons["48"]),
            title: manifest.name,
            type: 'load_AST',
            url: message.url,
          }).then(res => {
            console.log(res);
          }).catch(err => {
            console.log(err);
          });
        }).catch(err => {
          console.log('executeScript error', err);
        });
      });
      sendResponse({
        AST: AST
      });
    break;
  }

  // default: return false;

  }
});
