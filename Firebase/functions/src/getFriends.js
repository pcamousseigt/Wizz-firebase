
const {db} = require("./../db");
const {COLLECTION_USERS, COLLECTION_FRIENDS} = require("./globals");
const {getFriendRefsFromSnapshot, getFriendIdsFromSnapshot} =
    require("./getFriendRefsFromSnapshot");
const {
  getDataArrayFromQueryDocumentSnapshotPromises,
  getValuesFromQueryDocumentSnapshotPromises,
} = require("./getDataArrayFromQueryDocumentSnapshotPromises");

/**
 * Gets the friends of a user
 * @param {String} userUid The user identifier whose friendships are requested
 * @return {Array} The array of friends or throws an exception
 */
async function getFriends(userUid) {
  const userRef = db.collection(COLLECTION_USERS).doc(userUid);
  return db
      .collection(COLLECTION_FRIENDS)
      .where("userIds", "array-contains", userRef)
      .get()
      .then(
          (snapshot) => {
            const promises = getFriendRefsFromSnapshot(snapshot, userRef);
            return Promise.allSettled(promises)
                .then((results) => {
                  const friends =
                    getDataArrayFromQueryDocumentSnapshotPromises(
                        results,
                        "fulfilled",
                    );
                  return {response: friends};
                });
          })
      .catch(
          (error) => {
            console.log("Error trying to get friendships: " + error);
            return {response: []};
          },
      );
}

/**
 * Gets the friend identifiers of a user
 * @param {String} userUid The user identifier whose friendships are requested
 * @return {Array} The array of friends or throws an exception
 */
async function getFriendIds(userUid) {
  const userRef = db.collection(COLLECTION_USERS).doc(userUid);
  return db
      .collection(COLLECTION_FRIENDS)
      .where("userIds", "array-contains", userRef)
      .get()
      .then(
          (snapshot) => {
            const promises = getFriendIdsFromSnapshot(snapshot, userRef);
            return Promise.allSettled(promises)
                .then((results) => {
                  const friends =
                    getValuesFromQueryDocumentSnapshotPromises(
                        results,
                        "fulfilled",
                    );
                  return friends;
                });
          })
      .catch(
          (error) => {
            console.log("Error trying to get friend identifiers: " + error);
            return null;
          },
      );
}

module.exports = {
  getFriends,
  getFriendIds,
};
