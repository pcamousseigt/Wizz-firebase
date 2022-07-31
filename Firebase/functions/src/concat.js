
/**
 * Concatenates two strings by comparing the alphabetic orders of two strings
 * @param {String} str1 The first string to concatenate
 * @param {String} str2 The second string to concatenate
 * @return {String} The concatenated string with a separator
 */
function concat(str1, str2) {
  const SEPARATOR = "_";
  if (str1.localeCompare(str2) <= 0) {
    // If str1 <= str2
    return str1.concat(SEPARATOR, str2);
  }
  // Else if str1 > str2
  return str2.concat(SEPARATOR, str1);
}

module.exports = {
  concat,
};
