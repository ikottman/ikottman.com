importScripts('./lib/runeFinder.js');
importScripts('./lib/runewordFinder.js');

onmessage = function(e) {
  const runes = identifyRunes(e.data.image, e.data.runes, false);
  const runewords = findRunewords(runes);
  postMessage(runewords);
}