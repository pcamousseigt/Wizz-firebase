
const {getDataFromDocument} = require("./getDataFromDocument");

/**
 * Gets the data of all QueryDocumentSnapshot promises
 * @param {Array} promises The array of QueryDocumentSnapshot promises
 * @param {String} status The status of the promises
 * @return {Array} The array of data extracted from each promises
 */
function getDataArrayFromQueryDocumentSnapshotPromises(
    promises, status) {
  const dataArray = [];
  promises.forEach((result) => {
    if (result.status === status) {
      const data = getDataFromDocument(result.value);
      if (data != null) {
        dataArray.push(data);
      }
    }
  });
  return dataArray;
}

/**
 * Gets the value of all QueryDocumentSnapshot promises
 * @param {Array} promises The array of QueryDocumentSnapshot promises
 * @param {String} status The status of the promises
 * @return {Array} The array of value from each promises
 */
function getValuesFromQueryDocumentSnapshotPromises(
    promises, status) {
  const values = [];
  promises.forEach((result) => {
    if (result.status === status) {
      values.push(result.value);
    }
  });
  return values;
}

module.exports = {
  getDataArrayFromQueryDocumentSnapshotPromises,
  getValuesFromQueryDocumentSnapshotPromises,
};
