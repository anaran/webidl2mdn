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
  function setupMdnButton(options) {
    if (options.button &&
        options.path &&
        options.destination &&
        options.source &&
        options.tags) {
      options.button.value = 'Create/add to ' + options.path + ' page on MDN';
      options.button.setAttribute('data-path', options.path);
      options.button.addEventListener('click', function (event) {
        // event.preventDefault();
        if (options.destination && options.destination.value.length > 0 &&
            options.destination.validity.valid && this.dataset['path']) {
          let url = document.baseURI + options.destination.value + this.dataset['path'] + '$edit';
          let xhr = new XMLHttpRequest();
          xhr.open('GET', url);
          xhr.onload = function () {
            if (this.readyState == xhr.DONE) {
              switch (this.statusText) {
                case "OK": {
                  self.port.emit('request_skeleton2mdn', {
                    source: options.source.textContent,
                    tags: options.tags,
                    url: url
                  });
                  break;
                }
                case "NOT FOUND": {
                  self.port.emit('request_skeleton2mdn', {
                    source: options.source.textContent,
                    tags: options.tags,
                    url: this.responseURL.replace(/\$edit/, '')
                  });
                  break;
                }
              }
              DEBUG_ADDON && console.log('xhr.responseText', xhr.responseText);
            }
          };
          xhr.send();
        }
        else {
          options.destination.scrollIntoView();
          options.destination.focus();
          self.port.emit('notification', { text: "Select or type a relative path to where under MDN you want to put the generated content.\n\nI would like to report I don't like this notification." });
        }
      });
    }
  }
  function setupOverflowEditDiv(options) {
    let triangles = document.importNode(
      document.querySelector('template.triangles').content,
      "deep");
    let triangleRight = triangles.children[0].textContent;
    let triangleDown = triangles.children[1].textContent;
    options.div &&
      options.edit &&
      options.source &&
      options.content &&
      options.edit.addEventListener('click', function (event) {
      let bcr = options.div && options.div.getBoundingClientRect();
      if (options.source.style['display'] != 'none') {
        // options.content.innerHTML = options.source.textContent;
        window.requestAnimationFrame(function(domHighResTimeStamp) {
          options.source.style['display'] = 'none';
          options.content.style['display'] = 'block';
          options.edit.style['opacity'] = 1.0;
          options.overflow.style['visibility'] = 'visible';
          options.div.style['position'] = 'initial';
          options.div.style['top'] = 0;
          options.div.scrollIntoView();
          if (bcr && (bcr.y < 0/* || bcr.y > window.clientHeight*/)) {
          }
        });
      }
      else {
        options.source.style['display'] = 'block';
        options.content.style['display'] = 'none';
        options.edit.style['opacity'] = 0.5;
        options.overflow.style['visibility'] = 'hidden';
        // options.div.scrollIntoView();
        options.div.style['position'] = 'fixed';
        // options.div.style['top'] = 0;
        options.div.style['top'] = bcr.top + 'px';
      }
    });
    options.div &&
      options.overflow &&
      options.overflow.addEventListener('click', function (event) {
      let bcr = options.div && options.div.getBoundingClientRect();
      if (options.content &&
          options.content.style['height'] == '100%' ||
          options.source &&
          options.source.style['white-space'] == 'pre') {
        window.requestAnimationFrame(function(domHighResTimeStamp) {
          options.content && (options.content.style['height'] = '3rem');
          options.source && (options.source.style['white-space'] = 'nowrap');
          // options.overflow.innerHTML = '&blacktriangleright;';
          options.overflow.textContent = triangleRight;
          options.edit && (options.edit.style['visibility'] = 'hidden');
          options.div.style['position'] = 'initial';
          // options.overflow.style['transform'] = 'rotate(45deg)';
          options.div.style['top'] = 0;
          options.div.scrollIntoView();
          if (bcr && (bcr.y < 0/* || bcr.y > window.clientHeight*/)) {
          }
        });
      }
      else {
        options.content && (options.content.style['height'] = '100%');
        options.source && (options.source.style['white-space'] = 'pre');
        // options.overflow.innerHTML = '&blacktriangledown;';
        options.overflow.textContent = triangleDown;
        options.edit && (options.edit.style['visibility'] = 'visible');
        // options.div.scrollIntoView();
        options.div.style['position'] = 'fixed';
        // options.overflow.style['transform'] = 'rotate(90deg)';
        // options.div.style['top'] = 0;
        options.div.style['top'] = bcr.top + 'px';
      }
    });
    options.edit && (options.edit.style['visibility'] = 'hidden');
  }
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
      setupOverflowEditDiv({
        overflow: applicationDescriptionToggle,
        source: applicationDescription,
        div: document.body.querySelector('.toggles'),
      });
      if ('exception' in data) {
        applicationDescriptionToggle.click();
        applicationDescription.style['color'] = 'red';
        applicationDescription.style['font-weight'] = 'bold';
        self.port.emit('notification', {
          text: "Click here if you need to review and report this parsing error:\n\n"
          + JSON.stringify(data, null, 2)
        });
      }
      // SEE ALSO Pages
      // https://developer.mozilla.org/en-US/docs/Template:GroupData
      // described in
      // https://developer.mozilla.org/en-US/docs/MDN/Contribute/Howto/Write_an_API_reference#Structure_of_an_interface_pages
      //
      // OVERVIEW Pages
      // See https://developer.mozilla.org/en-US/docs/MDN/Contribute/Howto/Write_an_API_reference#Structure_of_an_overview_page
      let productionNode = document.importNode(
        document.querySelector('template.production').content,
        "deep");
      productionNode.firstElementChild.href = data.homepage;
      productionNode.firstElementChild.textContent = data.generator;
      productionNode.lastElementChild.textContent = ' from ' + data.url;
      let overview = document.querySelector('template.overview').content;
      let overviewUI = document.importNode(overview, "deep").firstElementChild;
      document.body.appendChild(overviewUI);
      // document.head.appendChild(document.createElement("base")).href = "https://developer.mozilla.org/";
      document.title = data.title + ' for ' + nameOfApi;
      document.querySelector('h1#title').textContent = document.title;
      document.querySelector('div#production').textContent = 'Produced from ' + data.url;
      let overviewInterfacesHeadline = overviewUI.querySelector('h2#interfaces');
      overviewInterfacesHeadline.textContent = nameOfApi + ' Interfaces';
      let overviewSource = overviewUI.querySelector('.source');
      let overviewContent = overviewUI.querySelector('.content');
      let overviewPageTagsUI = overviewUI.querySelector('div.overview input.tags');
      let overviewPageTags = [
        "Overview",
        "API",
        "Reference",
        nameOfApi + " API"
      ];
      overviewPageTagsUI.value = overviewPageTags.toString();
      overviewSource.style['display'] = 'none';
      let overviewEditToggle = overviewUI.querySelector('.edit_toggle');
      let overviewToggleDiv = overviewUI.querySelector('.toggles');
      let overviewOverflowToggle = overviewUI.querySelector('.overflow_toggle');
      setupOverflowEditDiv({
        edit: overviewEditToggle,
        overflow: overviewOverflowToggle,
        div: overviewToggleDiv,
        source: overviewSource,
        content: overviewContent
      });
      let subTreeSelect = document.body.querySelector('#url_sub_tree_select');
      let subTreeInput = document.body.querySelector('#url_sub_tree');
      subTreeSelect.addEventListener('change', function (event) {
        subTreeInput.value = event.target.value;
      });
      subTreeInput.addEventListener('input', function (event) {
      });
      subTreeSelect.selectedIndex = -1;
      setupMdnButton({
        button: overviewUI.querySelector('.mdn_overview_url'),
        path: nameOfApi + '_API',
        destination: subTreeInput,
        source: overviewSource,
        tags: overviewPageTags 
      });
      Array.prototype.forEach.call(overviewUI.querySelectorAll('span.api_name'), function (element) {
        element.parentElement.replaceChild(document.createTextNode(nameOfApi), element);
      });
      document.createComment
      Array.prototype.forEach.call(overviewUI.querySelectorAll('span.generator_name'), function (element) {
        // element.parentElement.replaceChild(document.createTextNode(data.generator + ' from ' + data.url), element);
        element.parentElement.replaceChild(productionNode, element);
      });
      // See https://developer.mozilla.org/en-US/docs/MDN/Contribute/Howto/Write_an_API_reference
      let interfaceDefinitionList = overviewContent.querySelector('#interface_definitions');
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
            interfaceDefinitionList.appendChild(interfaceDefinitionUI);
            // interfaceDefinitionList.appendChild(interfaceDefinitionUI.children[0]);
            // FIXME: why does index of element [1] move down to [0]
            // interfaceDefinitionList.appendChild(interfaceDefinitionUI.children[0]);
            // FIXME: Should only replace in one pair, not whole dl.
            Array.prototype.forEach.call(interfaceDefinitionList.querySelectorAll('.interface_name'), function (element) {
              element.parentElement.replaceChild(document.createTextNode(value.name), element);
            });
            let interfacePage = document.querySelector('template.interface_page').content;
            let interfacePageUI = document.importNode(interfacePage, "deep").firstElementChild;
            document.body.appendChild(interfacePageUI);
            let interfacePageSource = interfacePageUI.querySelector('.source');
            let interfacePageContent = interfacePageUI.querySelector('.content');


            let interfacePageTagsUI = interfacePageUI.querySelector('div.interface_page input.tags');
            let interfacePageTags = [
              "Interface",
              "API",
              "Reference",
              nameOfApi + " API",
              value.name
            ];
            interfacePageTagsUI.value = interfacePageTags.toString();
            interfacePageSource.style['display'] = 'none';
            let interfacePageEditToggle = interfacePageUI.querySelector('.edit_toggle');
            let interfacePageToggleDiv = interfacePageUI.querySelector('.toggles');
            let interfacePageOverflowToggle = interfacePageUI.querySelector('.overflow_toggle');
            setupOverflowEditDiv({
              edit: interfacePageEditToggle,
              overflow: interfacePageOverflowToggle,
              div: interfacePageToggleDiv,
              source: interfacePageSource,
              content: interfacePageContent
            });
            setupMdnButton({
              button: interfacePageUI.querySelector('.mdn_overview_url'),
              path: value.name,
              destination: subTreeInput,
              source: interfacePageSource,
              tags: interfacePageTags 
            });
            Array.prototype.forEach.call(interfacePageUI.querySelectorAll('span.api_name'), function (element) {
              element.parentElement.replaceChild(document.createTextNode(nameOfApi), element);
            });
            Array.prototype.forEach.call(interfacePageUI.querySelectorAll('span.interface_name'), function (element) {
              element.parentElement.replaceChild(document.createTextNode(value.name), element);
            });
            let productionNode = document.importNode(
              document.querySelector('template.production').content,
              "deep");
            productionNode.firstElementChild.href = data.homepage;
            productionNode.firstElementChild.textContent = data.generator;
            productionNode.lastElementChild.textContent = ' from ' + data.url;
            Array.prototype.forEach.call(interfacePageContent.querySelectorAll('span.generator_name'), function (element) {
              // element.parentElement.replaceChild(document.createTextNode(data.generator + ' from ' + data.url), element);
              element.parentElement.replaceChild(productionNode, element);
            });
            let properties = interfacePageContent.querySelector('#property_definitions');
            let eventHandlerProperties = interfacePageContent.querySelector('#event_handler_property_definitions');
            let methods = interfacePageContent.querySelector('#method_definitions');
            let methodsObsolete = interfacePageContent.querySelector('#method_definitions_obsolete');
            if (value.inheritance) {
              console.log('.methods.but_inherits', interfacePageContent.querySelector('.methods.but_inherits'));
              let domRefList = value.inheritance.toString().split(/,/).map(function (domRef) {
                return '{{domxref("' + domRef + '")}}';
              }).toString();
              console.log('domRefList', domRefList);
              // method == webidl operation
              if (value.members.some(function (member) {
                if (member.type == 'operation') {
                  return true;
                }
              })) {
                Array.prototype.forEach.call(
                  interfacePageContent.querySelectorAll('.methods.also_inherits span.domref_list'),
                  function (element) {
                    element.parentElement.replaceChild(document.createTextNode(
                      domRefList
                    ), element);
                  });
                interfacePageContent.querySelector('.methods.but_inherits').style['display'] = 'none';
              }
              else {
                Array.prototype.forEach.call(
                  interfacePageContent.querySelectorAll('.methods.but_inherits span.domref_list'),
                  function (element) {
                    element.parentElement.replaceChild(document.createTextNode(
                      domRefList
                    ), element);
                  });
                interfacePageContent.querySelector('.methods.also_inherits').style['display'] = 'none';
              }
              // property == webidl attribute
              if (value.members.some(function (member) {
                if (member.type == 'attribute') {
                  return true;
                }
              })) {
                Array.prototype.forEach.call(
                  interfacePageContent.querySelectorAll('.properties.also_inherits span.domref_list'),
                  function (element) {
                    element.parentElement.replaceChild(document.createTextNode(
                      domRefList
                    ), element);
                  });
                interfacePageContent.querySelector('.properties.but_inherits').style['display'] = 'none';
              }
              else {
                Array.prototype.forEach.call(
                  interfacePageContent.querySelectorAll('.properties.but_inherits span.domref_list'),
                  function (element) {
                    element.parentElement.replaceChild(document.createTextNode(
                      domRefList
                    ), element);
                  });
                interfacePageContent.querySelector('.properties.also_inherits').style['display'] = 'none';
              }
            }
            else {
              console.log('.methods.but_inherits', interfacePageContent.querySelector('.methods.but_inherits'));
              interfacePageContent.querySelector('.methods.but_inherits').style['display'] = 'none';
              interfacePageContent.querySelector('.methods.also_inherits').style['display'] = 'none';
              interfacePageContent.querySelector('.properties.but_inherits').style['display'] = 'none';
              interfacePageContent.querySelector('.properties.also_inherits').style['display'] = 'none';
            }
            value.members.forEach(function (member) {
              switch (member.type) {
                case "attribute": {
                  let propertyUI = document.importNode(interfaceDefinition, "deep");
                  Array.prototype.forEach.call(propertyUI.querySelectorAll('.interface_name'), function (element) {
                    element.parentElement.replaceChild(document.createTextNode(value.name + '.' + member.name), element)
                  });
                  if (member.readonly) {
                    propertyUI.firstElementChild.textContent += '{{readonlyInline}}';
                  }
                  if (member.extAttrs.some(function (attr) {
                    if (attr.name == 'CheckAnyPermissions' &&
                        attr.rhs && 
                        attr.rhs.value &&
                        // FIXME: modified value used to make
                        // "webidl2": "2.0.11" parse
                        // https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/1c3e06eaf70562bd2db80c056d5aaef6b18208c4/Apps.webidl
                        attr.rhs.value == 'webapps_manage') {
                      return true;
                    }
                  })) {
                    propertyUI.firstElementChild.textContent += '{{B2GOnlyHeader2("certified")}}';
                  }
                  if (member.idlType.idlType == 'EventHandler') {
                    eventHandlerProperties.appendChild(propertyUI);
                  }
                  else {
                    properties.appendChild(propertyUI);
                    // Array.prototype.forEach.call(properties.querySelectorAll('.interface_name'), function (element) {
                    //   element.parentElement.replaceChild(document.createTextNode(value.name + '.' + member.name + '()'), element);
                    // });
                  }
                  break;
                }
                case "operation": {
                  let methodUI = document.importNode(interfaceDefinition, "deep");
                  methods.appendChild(methodUI);
                  Array.prototype.forEach.call(methods.querySelectorAll('.interface_name'), function (element) {
                    element.parentElement.replaceChild(document.createTextNode(value.name + '.' + member.name + '()'), element);
                  });
                  break;
                }
              }
            });
            interfacePageSource.textContent = interfacePageContent.innerHTML;
            break;
          }
        }
      });
      document.normalize();
      overviewSource.textContent = overviewContent.innerHTML;
    }
    catch (e) {
      // console.exception(e);
      console.log('exception', JSON.stringify(e, Object.keys(e), 2), e.toString());
    }
  });
  // self is undefined when using require in jpm test.
  (typeof self !== 'undefined') && self.port.emit('request_webidl2mdn');
})();
