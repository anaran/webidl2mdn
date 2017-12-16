# MDN Web API Referee

MDN Web API Referee Add-on for Desktop and Mobile Firefox 

# Installation

The ![][icon] Firefox Add-on is distributed via addons.mozilla.org.

[icon]: data/posts-48.png "MDN Web API Referee"

See [which versions](https://addons.mozilla.org/en-US/firefox/addon/mdn-web-api-referee/versions/) are available right now.

# README for Developers

This README is not delivered with the add-on. It is aimed at
developers and contributors.

## Add-on User Help

[data/HELP.md](data/HELP.md) is also accessible via the `Help` link in the add-on tab.

## Issues

See [Issues ·
anaran/webidl2mdn](https://github.com/anaran/webidl2mdn/issues).

You can search for existing issues via the `Issues` link in the add-on tab.

Some of these may be created directly by add-on users when they click
the error notifications provided by the add-on.

## Dependencies

npm package webidl2 (currently 9.0.0) is used to create the abstract
syntax tree from the webidl file. That AST is used to build the user
interface for document fragment generation.

webidl updates are picked up using npm update according to package.json settings.

Since node_modules is ignored by web-ext I am manually copying
node_modules/webidl2/lib/ to webidl2/lib/ when I upgrade.

## Contributing

[GitHub - Contributing to a Project](http://git-scm.com/book/en/v2/GitHub-Contributing-to-a-Project) should be useful if you are not familiar with pull requests, as http://git-scm.com in general is a very good and practical reference.

