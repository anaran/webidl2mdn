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
(function() {
  let DEBUG_ADDON = false;

  let tryConvertToJson = function(text) {
    let json = text.replace(/^\s*\/\/.+\n/gm, '');
    json = json.replace(/'([^']*)'/g, '"$1"');
    json = json.replace(/([^"\/])\b(\w(\w|\d)*):/g, '$1"$2":');
    return json;
  };
  // self is undefined when using require in jpm test.
  (typeof self !== 'undefined') && self.port.on('load_webidl2mdn', function(data) {
    try {
      console.log('load_webidl2mdn', data);
      let path = data.source.split('/');
      let nameOfApi = data.source.match(/([^\/]+)\.webidl\b/)[1];
      let applicationDescription = document.getElementById('application_description');
      let applicationDescriptionToggle = document.getElementById('application_description_toggle');
      // NOTE: Keep this first, before adding nodes to document.
      // Array.prototype.forEach.call(document.querySelectorAll('div.settings'), function(setting) {
      //   document.body.removeChild(setting);
      // });
      applicationDescription.textContent = JSON.stringify(data, null, 2);
      applicationDescriptionToggle.addEventListener('click', function (event) {
        if (applicationDescription.style['white-space'] != 'pre') {
          applicationDescription.style['white-space'] = 'pre';
        }
        else {
          // applicationDescription.style['overflow'] = 'hidden';
          applicationDescription.style['white-space'] = 'nowrap';
        }
      });
      // SEE ALSO Pages
      // https://developer.mozilla.org/en-US/docs/Template:GroupData
      // described in
      // https://developer.mozilla.org/en-US/docs/MDN/Contribute/Howto/Write_an_API_reference#Structure_of_an_interface_pages
      //
      // OVERVIEW Pages
      // See https://developer.mozilla.org/en-US/docs/MDN/Contribute/Howto/Write_an_API_reference#Structure_of_an_overview_page
      let overview = document.querySelector('template.overview').content;
      let overviewUI = document.importNode(overview, "deep").firstElementChild;
      document.body.appendChild(overviewUI);
      document.title = 'Generated MDN Skeletons for API ' + nameOfApi;
      document.querySelector('h1#title').textContent = document.title;
      document.querySelector('div#production').textContent = 'Produced from ' + data.source;
      let overviewInterfacesHeadline = overviewUI.querySelector('h2#interfaces');
      overviewInterfacesHeadline.textContent = nameOfApi + ' Interfaces';
      let overviewSource = document.getElementById('overview_source');
      let overviewTags = document.getElementById('overview_tags');
      overviewTags.value = "Overview, API";
      overviewUI.normalize();
      overviewSource.value = overviewUI.innerHTML;
      overviewSource.style['display'] = 'none';
      let overviewToggle = document.getElementById('overview_toggle');
      overviewToggle.addEventListener('click', function (event) {
        if (overviewSource.style['display'] != 'none') {
          overviewSource.style['display'] = 'none';
          overviewUI.style['display'] = 'block';
        }
        else {
          overviewSource.style['display'] = 'block';
          overviewUI.style['display'] = 'none';
        }
      });
      // See https://developer.mozilla.org/en-US/docs/MDN/Contribute/Howto/Write_an_API_reference
      data.AST.forEach(function (value) {
        let content = document.querySelector('template.' + syntaxElement.type).content;
        let syntaxUI = document.importNode(content, "deep").firstElementChild;
        let label = syntaxUI.children[0];
        let element = syntaxUI.children[1];
        let description = syntaxUI.children[2];
        label.textContent = syntaxElement.title;
        description.textContent = syntaxElement.description;
        // label.setAttribute('data-l10n-id', syntaxElement.name + '_title');
        // description.setAttribute('data-l10n-id', syntaxElement.name + '_description');
        switch (syntaxElement.type) {
          case "dictionary": {
            element.checked = data.prefs[syntaxElement.name];
            element.addEventListener('change', function(event) {
            });
            element.name = value.name;
            break;
          }
          case "enum": {
            element.value = value.label;
            element.addEventListener('click', function(event) {
              self.port.emit('save_setting', {
                name: value.name,
                value: event.target.textContent
              });
            });
            break;
          }
          case "interface": {
            // NOTE: We JSON.parse preferences starting with JSON and report errors.
            let isJson = /^JSON/.test(value.name);
            element.textContent = data.prefs[value.name];
            // NOTE: Thanks
            // https://github.com/jrburke/gaia/commit/204a4b0c55eafbb20dfaa233fbbf2579a8f81915
            element.addEventListener('paste', function(event) {
              event.preventDefault();
              var text = event.clipboardData.getData('text/plain');
              if (isJson) {
                text = tryConvertToJson(text);
              }
              // Only insert if text. If no text, the execCommand fails with an
              // error.
              if (text) {
                document.execCommand('insertText', false, text);
              }
            });
            isJson && element.addEventListener('blur', function(event) {
              try {
                event.target.textContent = event.target.textContent.trim();
                if (event.target.textContent.length == 0) {
                  event.target.textContent = "{}";
                }
                // NOTE: This regexp might not catch all cases, so let's just try always
                // if (/'|:[^\/]|^\s*\/\//.test(event.target.textContent)) {
                event.target.textContent = tryConvertToJson(event.target.textContent);
                // }
                event.target.textContent = JSON.stringify(JSON.parse(event.target.textContent), null, 2);
                self.port.emit('save_setting', {
                  name: value.name,
                  value: event.target.textContent
                });
                element.name = value.name;
              }
              catch (e) {
                // reportError(event.target);
              }
            });
            break;
          }
          case "menulist": {
            let content2 = document.querySelector('template.' + value.type + '_item').content;
            value.options.forEach(function (item) {
              let syntaxUI2 = document.importNode(content2, "deep").firstElementChild;
              syntaxUI2.textContent = item.label;
              syntaxUI2.value = item.value;
              if (data.prefs[value.name] == item.value) {
                syntaxUI2.selected = true;
              }
              element.appendChild(syntaxUI2);
            });
            element.name = value.name;
            element.addEventListener('change', function(event) {
              self.port.emit('save_setting', {
                name: value.name,
                value: event.target.value
              });
            });
            break;
          }
          case "radio": {
            let content2 = document.querySelector('template.' + value.type + '_item').content;
            value.options.forEach(function (item) {
              let syntaxUI2 = document.importNode(content2, "deep");
              let radio = syntaxUI2.children[0];
              let label = syntaxUI2.children[1];
              radio.value = item.value;
              radio.id = value.name + '.' + item.value;
              radio.name = value.name;
              label.textContent = item.label;
              // O_Oh
              label.htmlFor = value.name + '.' + item.value;
              if (data.prefs[value.name] == radio.value) {
                radio.checked = true;
              }
              element.appendChild(syntaxUI2);
            });
            element.addEventListener('change', function(event) {
              self.port.emit('save_setting', {
                name: value.name,
                value: event.target.value
              });
            });
            break;
          }
        }
        document.body.appendChild(syntaxUI);
      });
    }
    catch (e) {
      console.log('exception', JSON.stringify(e, Object.keys(e), 2), e.toString());
    }
  });
  // self is undefined when using require in jpm test.
  (typeof self !== 'undefined') && self.port.emit('request_webidl2mdn');
})();
