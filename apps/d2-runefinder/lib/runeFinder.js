importScripts('opencv.js');
function identifyRunes(imageData, runeImages, renderResult) {
  let inventoryImg = cv.matFromImageData(imageData);
  // load cropped and greyscale inventory
  inventoryImg = cropImage(inventoryImg);
  let greyscaleInventory = inventoryImg.clone();
  cv.cvtColor(inventoryImg, greyscaleInventory, cv.COLOR_RGBA2GRAY, 0);

  let runes = loadRunes(runeImages);
  const locations = findRuneLocations(greyscaleInventory, runes, 0.80);

  if (renderResult) {
    drawRectangles(inventoryImg, runes[0].mat.cols, runes[0].mat.rows, locations);
  }

  inventoryImg.delete();
  greyscaleInventory.delete();

  const identifiedRunes = {};
  Object.entries(locations).forEach(([rune, matches]) => {
    identifiedRunes[rune] = matches.length;
  });

  return identifiedRunes;
}

// load and greyscale all the runes
function loadRunes(runeImages) {
  const runes = [];
  runeImages.forEach(rune => {
    let mat = cv.matFromImageData(rune.image);
    cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
    runes.push({
      mat: mat,
      name: rune.name
    });
  });
  return runes;
}

function cropImage(image) {
  const w = image.cols * .4; // keep the left 40% (just the stash)
  const h = image.rows * .75; // cut off 25% off the bottom
  const rect = new cv.Rect(0, 0, w, h);
  return image.roi(rect);
}

function drawRectangles(image, runeCols, runeRows, matchesByRune) {
  const color = new cv.Scalar(0, 255, 0, 255);
  Object.entries(matchesByRune).forEach(([rune, matches]) => {
    matches.forEach((match) => {
      let point = new cv.Point(match.x + runeCols, match.y + runeRows);
      cv.rectangle(image, match, point, color, 2, cv.LINE_8, 0);
      let textPoint = new cv.Point(match.x + runeCols - 35, match.y + runeRows - 3);
      cv.putText(image, rune, textPoint, cv.FONT_HERSHEY_DUPLEX, 0.6, color, 1);
    });
  });
  cv.imshow('canvasOutput', image);
}

function isDuplicate(other, matches) {
  return matches.some(match => Math.abs(match.x - other.x) < 40 && Math.abs(match.y - other.y) < 40);
}

function findRuneLocations(image, runes, threshhold) {
  // list of matches keyed on rune name
  const matches = {};
  let output = new cv.Mat();

  runes.forEach((rune) => {
    cv.matchTemplate(image, rune.mat, output, cv.TM_CCOEFF_NORMED);
    let maxValue = 1;
    let i = 0;
    while (maxValue > threshhold) {
      i= i+ 1;
      let result = cv.minMaxLoc(output);
      maxValue = result.maxVal;
      let { x, y } = result.maxLoc;

      if (maxValue > threshhold) {
        const currentMatches = matches[rune.name] ?? [];
        if (!isDuplicate(result.maxLoc, currentMatches)) {
          matches[rune.name] = [...currentMatches, result.maxLoc];
        }
        output.floatPtr(y, x)[0] = 0; // set the max to 0 so we find a new max
      }
    }
  });
  output.delete();
  return matches;
}