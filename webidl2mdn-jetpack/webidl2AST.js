console.log(window.location, window.document.readyState);
// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log(message);
//   sendResponse({message: message, sender: sender});
// });
const WebIDL2 = window.WebIDL2;
 
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
            type: 'load_AST',
            generator: manifest.name,
            icon: browser.extension.getURL(manifest.icons["48"]),
            title: manifest.name,
            url: message.url,
            AST: AST
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
