
/**
 * Gets the promises of user who invited me objects
 * @param {QuerySnapshot} snapshot The snapshot containing the documents
 * @return {Array} The array of promises of user objects
 */
function getUserInvitedMeRefs(snapshot) {
  const values = [];

  if (snapshot.empty) {
    console.log("No matching documents.");
    return values;
  }

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const userRef = data["from"];
    values.push(userRef.get());
  });

  return values;
}

module.exports = {
  getUserInvitedMeRefs,
};
