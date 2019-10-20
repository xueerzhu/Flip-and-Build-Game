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
*/

// deserted letters idea
// let letters = ["a", "b","c","d","e","f","g","h","i","j","k",
//               "l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];

let tiles = {}; // tiles array storing color information
let tileSpecial;

let worldSeed; // procedral world seeding using xxhash function

// variables used for A* pathfinding
let openSet = [];
let closedSet = [];
let starTile = 1000001; // currently a magic number help with A*, BAD practice
let revealedTile = 55555;
let startTile;  // one of two goals 
let closedTile; // one of two goals 
let startTileOld;
let closedTileOld;

// variables control cell information
let clicks = {};
let flipped = []; //array of size 2 that memorize the last two flipped tile key info
let revealed = [];

function p2_preload() {}

function p2_tileClicked(i, j) {
  let key = [i, j];
  let keyOne;
  let keyTwo;
  
  if(revealed.includes(key)) {
    return;
  }

  if (flipped.length > 1) {
    keyOne = flipped.pop();
    keyTwo = flipped.pop();

    if (
      XXH.h32("tile:" + keyOne, worldSeed) % 5 !=
      XXH.h32("tile:" + keyTwo, worldSeed) % 5
    ) {
      clicks[keyOne] = 0;
      clicks[keyTwo] = 0;
    }
    else {
      clicks[keyOne] = revealedTile;
      revealed.push(keyOne);
      clicks[keyTwo] = revealedTile;
      revealed.push(keyTwo);
    }
  }

  flipped.push(key);
  clicks[key] = 1 + (clicks[key] | 0);
  //clicks[key] = revealedTile;
  // starTile indicates it is A* traversed special tile

  clicks[startTile] = starTile;
  clicks[closedTile] = starTile;
  for (let i = 0; i < openSet.length; i++) {
    clicks[openSet[i]] = starTile;
  }
}

function p2_worldKeyChanged(key) {
  // empty arrays
  openSet = [];
  closedSet = [];
  flipped = [];
  revealed = [];
  
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  let startSeed = 3 + XXH.h32("startY:" + key, worldSeed) % 8;
  startTile = [0, 0 - startSeed];
  closedTile = [0, 0 + startSeed];
  revealed.push(startTile);
  revealed.push(closedTile);
 
  openSet.push(startTile);

  clicks[startTileOld] = 0;
  clicks[closedTileOld] = 0;
}

function p2_setup() {
  tiles = ["#32B67A", "#FF9966", "#083EA7", "#FFD101", "#D73743"];
  tileSpecial = "#1B1D1C";

  // A*
  //openSet.push(startTile);
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

  // random code to do with Scramble idea, delete later
  // scraped here might be useful later
  //   push();
  //   fill(tileCurrent);
  //   beginShape();
  //   vertex(-tw, 0 , h);
  //   vertex(0, th , h);
  //   vertex(tw, 0 , h);
  //   vertex(0, -th , h);
  //   endShape(CLOSE, h);

  //   if (hashIndex == 0) {
  //     fill(255);
  //     textSize(20);
  //     textAlign(CENTER, CENTER);
  //     let letter = letters[XXH.h32("tile:" + [i, j], worldSeed) % 26]
  //     text(letter, 0, 0, h);
  //   }

  let n = clicks[[i, j]] | 0;

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
    ellipse(0, 0, 10, 5);
    translate(0, -10);
    fill("#ffffff");
    ellipse(0, 0, 10, 13);
    pop();
  } else if (n == revealedTile) {
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

      // fill(255);
      // textSize(20);
      // textAlign(CENTER, CENTER);
      // let letter = letters[XXH.h32("tile:" + [i, j], worldSeed) % 26]
      // text(letter, 0, 0);
    }
  }
}

function p2_drawSelectedTile(i, j) {
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
  
  //tile index info for debug
  // noStroke();
  // fill(0);
  // text("tile " + [i, j], 0, 0);
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

function p2_drawAfter() {
  startTileOld = startTile;
  closedTileOld = closedTile;
}
