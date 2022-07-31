
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

module.exports = {
  getDataArrayFromQueryDocumentSnapshotPromises,
};
