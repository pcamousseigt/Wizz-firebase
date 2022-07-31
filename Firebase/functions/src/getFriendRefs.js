
/**
 * Gets the promises of friend objects of the current user
 * @param {QuerySnapshot} snapshot The snapshot containing the documents
 * @param {DocumentReference} currentUserRef The current user requesting
 * the friendships
 * @return {Array} The array of promises of user objects
 */
function getFriendRefs(snapshot, currentUserRef) {
  const values = [];

  if (snapshot.empty) {
    console.log("No matching documents.");
    return values;
  }

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const userRefs = data["userIds"];
    userRefs.forEach((userRef) => {
      if (userRef.id != currentUserRef.id) {
        values.push(userRef.get());
      }
    });
  });

  return values;
}

module.exports = {
  getFriendRefs,
};
