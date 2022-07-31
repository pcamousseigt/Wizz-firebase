
/**
 * Gets the data from a document snapshot
 * @param {QueryDocumentSnapshot} snapshot The document snapshot
 * @return {Object} The data from the document snapshot
 */
function getDataFromDocument(snapshot) {
  if (!snapshot.exists) {
    console.log("No matching documents.");
    return null;
  }
  return snapshot.data();
}

module.exports = {
  getDataFromDocument,
};
