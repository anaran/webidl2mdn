var main = require("../");

exports["test main"] = function(assert) {
  assert.pass("Unit test running!");
  let w2s = require('../data/webidl2skeleton.js');
  assert.ok(typeof w2s != 'undefined', "typeof w2s != 'undefined'");
  let s2m = require('../data/skeleton2mdn.js');
  assert.ok(typeof s2m != 'undefined', "typeof s2m != 'undefined'");
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
