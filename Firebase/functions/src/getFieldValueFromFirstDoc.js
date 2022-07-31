
/**
 * Gets a field value from the first document of a simple snapshot response
 * @param {QuerySnapshot} snapshot The query snapshot containing the documents
 * @param {String} fieldName The name of the field
 * @return {*|Null} The value of the field or null if the field does not exists
 */
function getFieldValueFromFirstDoc(snapshot, fieldName) {
  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }

  // Gets the first document of the snapshot
  const doc = snapshot.docs[0];
  // Gets the value of the field
  const value = doc.get(fieldName);
  if (value != undefined) {
    return value;
  }

  return null;
}

module.exports = {
  getFieldValueFromFirstDoc,
};
