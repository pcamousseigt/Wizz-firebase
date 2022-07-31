
const {db} = require("./../db");
const {COLLECTION_USERS, COLLECTION_FRIENDS} = require("./globals");
const {getFriendRefs} = require("./getFriendRefs");
const {getDataArrayFromQueryDocumentSnapshotPromises} =
    require("./getDataArrayFromQueryDocumentSnapshotPromises");

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
            const promises = getFriendRefs(snapshot, userRef);
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

module.exports = {
  getFriends,
};
