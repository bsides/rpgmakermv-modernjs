# RPG Maker MV to Modern JS
RPG Maker MV refactor to modern JavaScript ES6+

It is just like the title says. I'm preparing a blog post on why am I doing this. In short I think ES6 classes are way more readable than thousands of prototype lines. Also, it's a good case study. In the future I plan on also adding Typescript.

## Install
TL;DR: Make a new project in RPG Maker MV, get all files from this repo and copy over this new project folder.

Step by step:
* Make a new project in RPG Maker MV
* In your terminal: 
```bash
cd <YOUR-RMMV-NEW-PROJECT-PATH>
git clone git@github.com:bsides/rpgmakermv-modernjs.git
```
* Copy everything from the folder `rpgmakermv-modernjs` to your project's root folder
* In your terminal, run `yarn`

## Develop
`yarn dev` will make it watch for changes and compile everything you need
