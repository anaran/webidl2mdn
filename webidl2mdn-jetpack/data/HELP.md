Create MDN API Reference Skeletons by visiting raw WebIDL files

Here's where to find some if you don't have your own

* https://mxr.mozilla.org/mozilla-central/source/dom/webidl/
* https://gist.github.com/search?l=webidl&q=.webidl

Click the `Raw` link or button after you visit a WebIDL file.

A new browser tab will open to show you what MDN API pages can be created from given file.

Most likely you will get a bold red error message and a clickable notification you can click
to open an issue, since webidl2 does not understand the pecularities of Mozilla WebIDL.

Don't open an issue unless you have tried the following tips.

See https://gist.github.com/anaran/d08cf8ccd082e81cf72a/revisions for changes I had to make to get https://gist.githubusercontent.com/anaran/d08cf8ccd082e81cf72a/raw/16df4b6d7c8dbc36212ad11c6ff070ccbde601a1/Apps.webidl to parse and generated skeletons.

I hope to get access to improved webidl2 sources soon that will be able to parse Mozilla WebIDL files.

