"use strict";

const path = require("path");
const fs = require("fs");
const commander = require("commander");
const formatter = require("./formatter");

commander
  .usage("[options] <in_file> <img_file> <out_file>")
  .option("-b, --bank [value]", "The output bank", "0")
  .parse(process.argv);

if(commander.args.length != 2) {
  console.error("must provide input and output files");
  process.exit(1);
}

const inputFilePath = path.resolve(commander.args[0]);
const outputFilePath = path.resolve(commander.args[1]);
const outputHeaderPath = outputFilePath.substr(0, outputFilePath.length - path.extname(outputFilePath).length) + ".h";

const name = (() => {
  const base = path.basename(inputFilePath);
  const withoutExtension = base.substr(0, base.length - path.extname(base).length);
  const name = withoutExtension[0].toLowerCase() + withoutExtension.substr(1);
  return name;
})();

const inputJSON = JSON.parse(fs.readFileSync(inputFilePath));
if(inputJSON.width != 10 || inputJSON.height != 8) {
  console.error("error: map must be 10x8 tiles");
  process.exit(1);
}

const bank = inputJSON["properties"]["Bank"] || 0;

if(inputJSON["layers"].length < 2) {
  console.error("error: map must have 2 layers.");
  process.exit(1);
}

const backgroundLayer = inputJSON["layers"][0];
const objectLayer = inputJSON["layers"][1];
const metaIndices = backgroundLayer.data.map((index) => { return index - 1 });

const tilesetDefinitions = inputJSON["tilesets"];
const objectTilesetFirstGID = tilesetDefinitions[1]["firstgid"];

const objects = objectLayer["data"].map((element) => {
  if(element == 0) {
    return element;
  } else {
    return (element - objectTilesetFirstGID) + 1;
  }
});

const objectCounts = {};
objects.forEach((object) => {
  if(object == 0) {
    return;
  }
  
  if(objectCounts[object] === undefined) {
    objectCounts[object] = 1;
  } else {
    objectCounts[object] = objectCounts[object] + 1;
  }
});

if(objectCounts["1"] === undefined) {
  console.error("error: map must have spawn point.");
  process.exit(1);
}

for (const key in objectCounts) {
  if (objectCounts.hasOwnProperty(key)) {
    const element = objectCounts[key];
    
    switch(key) {
      case "1":
        if(element != 1) {
          console.error("error: map must have exactly one spawn point.");
          process.exit(1);
        }
        break;
      case "9":
        // TODO: Clustering.
        break;
      default:
        console.error(`error: unrecognized object gid ${key}.`);
        process.exit(1);
    }
  }
}

function writeHeader() {
  let output = [];
  output.push("// IMPORTANT: Tool-generated file. Do not modify.");
  output.push(``);
  
  output.push(`#ifndef map_${name}_h`);
  output.push(`#define map_${name}_h`);
  output.push(``);
  
  output.push(`#include <gb/gb.h>`);
  output.push(``);
  
  output.push(`#define ${name}MapBank ${bank}`);
  output.push(``);
  
  output.push(`extern const GBUInt8 ${name}MapIndices[];`);
  output.push(``);
  
  output.push(`extern const GBUInt8 ${name}MapObjects[];`);
  output.push(``);
  
  output.push(`#endif`);
  output.push(``);
  
  output = output.join("\n");
  
  fs.writeFileSync(outputHeaderPath, output);
}

function writeImplementation() {
  let output = [];
  output.push("// IMPORTANT: Tool-generated file. Do not modify.");
  output.push(``);
  
  output.push(`#include "${path.basename(outputHeaderPath)}"`);
  output.push(``);
  
  output.push(`#pragma bank ${bank}`);
  output.push(``);
  
  output.push(`const GBUInt8 ${name}MapIndices[] = {`);
  const indexStrings = metaIndices.map((index) => {
    return `0x${formatter.toHex(index)}`;
  });
  output.push(`  ${indexStrings.join(", ")}`);
  output.push(`};`);
  output.push(``);
  
  output.push(`const GBUInt8 ${name}MapObjects[] = {`);
  const objectStrings = objects.map((index) => {
    return `0x${formatter.toHex(index)}`;
  });
  output.push(`  ${objectStrings.join(", ")}`);
  output.push(`};`);
  output.push(``);
  
  output = output.join("\n");
  
  fs.writeFileSync(outputFilePath, output);
}

writeHeader();
writeImplementation();
