
const {getDataFromDocument} = require("./getDataFromDocument");

/**
 * Gets the data of all QuerySnapshot promises
 * @param {Array} promises The array of QuerySnapshot promises
 * @param {String} status The status of the promises
 * @return {Array} The array of data extracted from each fulfilled promises
 */
function getDataArrayFromQuerySnapshotPromises(promises, status) {
  const dataArray = [];
  promises.forEach((result) => {
    if (result.status === status) {
      result.value.docs.forEach((doc) => {
        const data = getDataFromDocument(doc);
        if (data != null) {
          dataArray.push(data);
        }
      });
    }
  });
  return dataArray;
}


module.exports = {
  getDataArrayFromQuerySnapshotPromises,
};
