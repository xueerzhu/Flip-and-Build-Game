/// Author: Xueer Zhu 10/19/2019
///
/// A road constructing game about flipping colorful tiles and efficiently getting from one node to another
///
/// Remix of Adam Smith's Project base code at https://glitch.com/~p2-basic

"use strict";

/* global
  CLOSE
  background
  beginShape
  ellipse
  endShape
  fill
  line
  noFill
  noStroke
  noiseSeed
  pop
  push
  randomSeed
  stroke
  text
  translate
  vertex
  XXH
  textAlign
  textSize
  CENTER
  strokeWeight
  textFont
  loadFont
*/

let myFont;

let tiles = {}; // tiles array storing color information
let tileSpecial;

let worldSeed; // procedral world seeding using xxhash function

// variables used for DFS
let openSet = [];
let closedSet = [];

let starTile = 1000001; // currently a magic number help with A*, BAD practice
let revealedTile = 55555;
let startTile; // one of two goals
let closedTile; // one of two goals
let startTileOld;
let closedTileOld;

// variables control cell information
let clicks = {};
let revealed = {};
let flipped = []; //array of size 2 that memorize the last two flipped tile key info

function p2_preload() {
  myFont = loadFont(
    "https://cdn.glitch.com/94b9d331-3988-41c9-af9e-835d5d473346%2FInconsolata.otf?v=1571786237536"
  );
}

function p2_tileClicked(i, j) {
  let key = [i, j];
  let keyOne;
  let keyTwo;

  // implementation of two tiles flip color match detection 
  if (flipped.length > 1) {
    keyOne = flipped.pop();
    keyTwo = flipped.pop();
    
    // if not same color or if they are the same tile meaning player double clicks on one tile, we bort
    if (
      XXH.h32("tile:" + keyOne, worldSeed) % 5 !=
        XXH.h32("tile:" + keyTwo, worldSeed) % 5 ||
      JSON.stringify(keyOne) == JSON.stringify(keyTwo)
    ) {
      clicks[keyOne] = 0;
      clicks[keyTwo] = 0;
    } else {
      clicks[keyOne] = revealedTile;
      revealed[keyOne] = 1;
      openSet.push(keyOne);

      clicks[keyTwo] = revealedTile;
      revealed[keyTwo] = 1;
      openSet.push(keyTwo);
    }
  }

  flipped.push(key);
  clicks[key] = 1 + (clicks[key] | 0);

  clicks[startTile] = starTile;
  clicks[closedTile] = starTile;

  win();
}

function p2_worldKeyChanged(key) {
  // reset data
  openSet = [];
  closedSet = [];
  flipped = [];
  revealed = {};
  clicks = {};

  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  let startSeed = 3 + (XXH.h32("startY:" + key, worldSeed) % 8);
  startTile = [0, 0 - startSeed];
  closedTile = [0, 0 + startSeed];

  openSet.push(startTile);
  openSet.push(closedTile);
  //stack.push(startTile);
  //closedSet.push(startTile);

  clicks[startTileOld] = 0;
  clicks[closedTileOld] = 0;
}

function p2_setup() {
  tiles = ["#32B67A", "#FF9966", "#083EA7", "#FFD101", "#D73743"];
  tileSpecial = "#1B1D1C";
  textFont(myFont);
}

function p2_tileWidth() {
  return 32;
}
function p2_tileHeight() {
  return 16;
}

let [tw, th] = [p2_tileWidth(), p2_tileHeight()];

function p2_drawBefore() {}

function p2_drawTile(i, j) {
  noStroke();

  let tileCurrent;

  let hashIndex = XXH.h32("tile:" + [i, j], worldSeed) % 5;
  tileCurrent = tiles[hashIndex];

  let n = clicks[[i, j]] | 0;
  let r = revealed[[i, j]] | 0;

  // starTile are goals - end of the bridge
  if (n == starTile) {
    push();
    fill(tileSpecial);
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);
    fill("#ffffff");
    ellipse(0, -2, 15, 8);
    pop();
  } else if (n == revealedTile || r == 1) {
    push();
    fill(tileSpecial);
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);
    pop();
  } else {
    // if it should be visible, we draw it
    if (n % 2 == 1) {
      push();
      fill(tileCurrent);
      beginShape();
      vertex(-tw, 0);
      vertex(0, th);
      vertex(tw, 0);
      vertex(0, -th);
      endShape(CLOSE);
      pop();
    }
  }
}

function p2_drawSelectedTile(i, j) {
  let key = [i, j];

  push();
  noFill();
  stroke("#77EEDF");
  strokeWeight(3);

  beginShape();
  vertex(-tw, 0);
  vertex(0, th);
  vertex(tw, 0);
  vertex(0, -th);
  endShape(CLOSE);
  pop();

  //   //tile index info for debug
  //   noStroke();
  //   fill(0);
  //   text("tile " + [i, j], 0, 0);
}

function p2_drawOpenSetTile(i, j) {
  push();
  fill(tileSpecial);

  beginShape();
  vertex(-tw, 0);
  vertex(0, th);
  vertex(tw, 0);
  vertex(0, -th);
  endShape(CLOSE);

  pop();
}

// DFS impelmentation 
// Run search for every revealed tiles, check if two goals are connected
// win condition, true - alerts player, but the game is still playable
function win() {
  closedSet = [];
  let stack = [];
  stack.push(startTile);
  closedSet.push(startTile);

  while (stack.length > 0) {
    let t = stack.pop();
    let tN = [];
    tN.push([t[0], t[1] + 1]);
    tN.push([t[0], t[1] - 1]);
    tN.push([t[0] + 1, t[1]]);
    tN.push([t[0] - 1, t[1]]);

    for (let i = 0; i < tN.length; i++) {
      for (let j = 0; j < openSet.length; j++) {
        if (JSON.stringify(openSet[j]) == JSON.stringify(tN[i])) {
          let flag = true;
          for (let k = 0; k < closedSet.length; k++) {
            if (JSON.stringify(openSet[j]) == JSON.stringify(closedSet[k])) {
              flag = false;
            }
          }
          if (flag == true) {
            stack.push(tN[i]);
            closedSet.push(tN[i]);
          }
        }
      }
    }
  }

  for (let k = 0; k < closedSet.length; k++) {
    if (JSON.stringify(closedTile) == JSON.stringify(closedSet[k])) {
      return true;
    }
  }

  return false;
}

// utility function for data bookkeeping, HUD info 
function p2_drawAfter() {
  // // debug for DFS
  // function keyPressed() {
  //   if (keyCode === "G") {
  //     push();
  //     textSize(10);
  //     text("won? : " + win(), 10, 30);
  //     text("openSet : " + openSet, 10, 60);
  //     text("closedSet : " + closedSet, 10, 90);
  //     pop();
  //   }
  // }

  startTileOld = startTile;
  closedTileOld = closedTile;

  if (win()) {
    fill("#FE667B");
    textSize(20);
    text("You Won ! ", 50, 50);
    let message = "Enter a new world key to play a different level : )";
    text(message, 50, 90);
  }
}
