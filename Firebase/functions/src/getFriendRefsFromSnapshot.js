
/**
 * Gets the promises of friend objects of the current user
 * @param {QuerySnapshot} snapshot The snapshot containing the documents
 * @param {DocumentReference} currentUserRef The current user requesting
 * the friendships
 * @return {Array} The array of promises of user objects
 */
function getFriendRefsFromSnapshot(snapshot, currentUserRef) {
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

/**
 * Gets the promises of current user's friend identifiers
 * @param {QuerySnapshot} snapshot The snapshot containing the documents
 * @param {DocumentReference} currentUserRef The current user requesting
 * the friendship identifiers
 * @return {Array} The array of promises of identifiers
 */
function getFriendIdsFromSnapshot(snapshot, currentUserRef) {
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
        values.push(userRef.id);
      }
    });
  });

  return values;
}

module.exports = {
  getFriendRefsFromSnapshot,
  getFriendIdsFromSnapshot,
};
