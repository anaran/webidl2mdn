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
      DEBUG_ADDON && console.log('load_webidl2mdn', data);
      let path = data.url.split('/');
      let nameOfApi = data.url.match(/([^\/]+)\.webidl\b/)[1];
      document.getElementById('favicon').href = data.icon;
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
      // document.head.appendChild(document.createElement("base")).href = "https://developer.mozilla.org/";
      document.title = 'Generated MDN Skeletons for API ' + nameOfApi;
      document.querySelector('h1#title').textContent = document.title;
      document.querySelector('div#production').textContent = 'Produced from ' + data.url;
      let overviewInterfacesHeadline = overviewUI.querySelector('h2#interfaces');
      overviewInterfacesHeadline.textContent = nameOfApi + ' Interfaces';
      let overviewSource = document.getElementById('overview_source');
      let mdnOverviewUrl = document.getElementById('mdn_overview_url');
      let mdnOverviewTagsUrl = document.getElementById('mdn_overview_tags_url');
      let subTreeSelect = document.getElementById('url_sub_tree_select');
      let subTreeInput = document.getElementById('url_sub_tree');
      subTreeSelect.addEventListener('change', function (event) {
        subTreeInput.value = event.target.value;
        mdnOverviewUrl.href = subTreeInput.value + nameOfApi + "_API$edit";
        mdnOverviewTagsUrl.href = mdnOverviewUrl + '#page-tags';
      });
      subTreeInput.addEventListener('input', function (event) {
        mdnOverviewUrl.href = subTreeInput.value + nameOfApi + "_API$edit";
        mdnOverviewTagsUrl.href = mdnOverviewUrl + '#page-tags';
      });
      // subTreeInput.addEventListener('change', function (event) {
      //   mdnOverviewUrl.href = subTreeInput.value + nameOfApi + "_API$edit";
      //   mdnOverviewTagsUrl.href = mdnOverviewUrl + '#page-tags';
      // });
      mdnOverviewUrl.addEventListener('click', function (event) {
        event.preventDefault();
        let xhr = new XMLHttpRequest();
        xhr.open('GET', event.target.href);
        xhr.onload = function () {
          if (this.readyState == xhr.DONE) {
            switch (this.statusText) {
              case "OK": {
                self.port.emit('request_skeleton2mdn', {
                  source: overviewSource.textContent,
                  tags: overviewTags.value,
                  url: event.target.href
                });
                break;
              }
              case "NOT FOUND": {
                self.port.emit('request_skeleton2mdn', {
                  source: overviewSource.textContent,
                  tags: overviewTags.value,
                  url: event.target.href.replace(/\$edit/, '')
                });
                break;
              }
            }
            DEBUG_ADDON && console.log('xhr.responseText', xhr.responseText);
          }
        };
        xhr.send();
      });
      // subTreeSelect.select(1);
      // subTreeSelect.select(0);
      subTreeSelect.selectedIndex = -1;
      // subTreeSelect.selectedIndex = 1;
      // if (subTreeSelect.selectedIndex != -1) {
      //   subTreeInput.value = subTreeSelect.options[subTreeSelect.selectedIndex].value;
      // }
      let overviewTags = document.getElementById('overview_tags');
      overviewTags.value = "Overview, API, Reference, " + nameOfApi + " API";
      overviewSource.style['display'] = 'none';
      let overviewToggle = document.getElementById('overview_toggle');
      overviewToggle.addEventListener('click', function (event) {
        if (overviewSource.style['display'] != 'none') {
          overviewUI.innerHTML = overviewSource.textContent;
          window.requestAnimationFrame(function(domHighResTimeStamp) {
            overviewSource.style['display'] = 'none';
            overviewUI.style['display'] = 'block';
          });
        }
        else {
          overviewSource.style['display'] = 'block';
          overviewUI.style['display'] = 'none';
        }
      });
      Array.prototype.forEach.call(document.body.querySelectorAll('span.api_name'), function (element) {
        element.parentElement.replaceChild(document.createTextNode(nameOfApi), element);
      });
      Array.prototype.forEach.call(document.body.querySelectorAll('span.generator_name'), function (element) {
        element.parentElement.replaceChild(document.createTextNode(data.generator + ' from ' + data.url), element);
      });
      // See https://developer.mozilla.org/en-US/docs/MDN/Contribute/Howto/Write_an_API_reference
      let interfaceDefinitionList = document.getElementById('interface_definitions');
      data.AST.forEach(function (value) {
        switch (value.type) {
          case "dictionary": {
            break;
          }
          case "enum": {
            break;
          }
          case "interface": {
            let interfaceDefinition = document.querySelector('template.interface_definition').content;
            let interfaceDefinitionUI = document.importNode(interfaceDefinition, "deep");
            // interfaceDefinitionList.appendChild(interfaceDefinitionUI);
            interfaceDefinitionList.appendChild(interfaceDefinitionUI.children[0]);
            // FIXME: why does index of element [1] move down to [0]
            interfaceDefinitionList.appendChild(interfaceDefinitionUI.children[0]);
            // FIXME: Should only replace in one pair, not whole dl.
            Array.prototype.forEach.call(interfaceDefinitionList.querySelectorAll('.interface_name'), function (element) {
              element.parentElement.replaceChild(document.createTextNode(value.name), element);
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
      });
      document.normalize();
      overviewSource.textContent = overviewUI.innerHTML;
    }
    catch (e) {
      DEBUG_ADDON && console.log('exception', JSON.stringify(e, Object.keys(e), 2), e.toString());
    }
  });
  // self is undefined when using require in jpm test.
  (typeof self !== 'undefined') && self.port.emit('request_webidl2mdn');
})();
