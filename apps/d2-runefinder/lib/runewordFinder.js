importScripts('./lib/runewords.js');

// find all runewords that can be made with the given runes
function findRunewords(runes) {
  return runewords
  .sort((a, b) => {
    return parseInt(a.level_required) - parseInt(b.level_required)
  })
  .filter(runeword => {
    return Object.entries(runeword.runes).every(([rune, required]) => {
      return runes[rune] >= required;
    });
  })
}