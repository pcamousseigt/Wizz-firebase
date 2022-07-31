
/**
 * Gets the promises of invited user objects
 * @param {QuerySnapshot} snapshot The snapshot containing the documents
 * @return {Array} The array of promises of user objects
 */
function getUserInvitedRefs(snapshot) {
  const values = [];

  if (snapshot.empty) {
    console.log("No matching documents.");
    return values;
  }

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const userRef = data["to"];
    values.push(userRef.get());
  });

  return values;
}

module.exports = {
  getUserInvitedRefs,
};
