# Anjin: a game by Craig Leinoff
### Inspired by Lee & Mathias's "Shogun" for the Commodore 64. _(Further inspired by James Clavell's novel "Shogun".)_

Requirements
------------
This runs on Phaser v2.4.4. I've included it in the /lib directory. Probably I shouldn't do that... But I had to patch it. (See https://github.com/photonstorm/phaser/pull/2244)

You need [Bower](http://bower.io/) to include easystarjs v0.2.3, RequireJS, and whatever else I add.  
Run `bower install`

You need [TSD](http://definitelytyped.org/tsd/) to include TypeScript definitions, if you want 'em.  
Run `tsd install`

Finally, this is all in TypeScript, so you'll need a [TypeScript compiler](http://www.typescriptlang.org/#Download). It should work just with the `tsc` command, because of the tsconfig.json file, but in case not...   
Run `tsc --module amd --target ES5 anjin.ts`

How To Play
-----------
Open the game in a webserver serving up index.html.

It isn't a game.
----------------
I know, sorry. It will be someday, I hope.
