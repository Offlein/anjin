# Anjin: a game by Craig Leinoff
### Inspired by Lee & Mathias's "Shogun" for the Commodore 64. _(Further inspired by James Clavell's novel "Shogun".)_

Requirements
------------
This runs on Phaser v2.4.4. I've included it in the /lib directory. Probably I shouldn't do that... But I had to patch it. (See https://github.com/photonstorm/phaser/pull/2244)

This is all in TypeScript, and meant to run in the browser. so you'll need to use [Browserify](http://browserify.org) with [tsify](https://www.npmjs.com/package/tsify).
Install those globally with: `npm install -g browserify` and then `npm install -g tsify`

To compile, run the following command: `browserify anjin.ts -p tsify --noImplicitAny  > anjin.js`

How To Play
-----------
Open the game in a webserver serving up index.html.

It isn't a game.
----------------
I know, sorry. It will be someday, I hope. Enjoy this screenshot so far:

![A screenshot](http://anjin.offlein.com/img/ss001.png)
