var main = require("../");

exports["test main"] = function(assert) {
  assert.pass("Unit test running!");
  let w2m = require('../data/webidl2mdn.js');
  assert.ok(typeof w2m != 'undefined', "typeof w2m != 'undefined'");
};

exports["test main async"] = function(assert, done) {
  assert.pass("async Unit test running!");
  done();
};

exports["test dummy"] = function(assert, done) {
  main.dummy("foo", function(text) {
    assert.ok((text === "foo"), "Is the text actually 'foo'");
    done();
  });
};

require("sdk/test").run(exports);
