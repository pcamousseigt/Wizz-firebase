
const {functions, db, Timestamp} = require("./../db");
const {COLLECTION_USERS, COLLECTION_FRIENDS} = require("./globals");
const {concat} = require("./concat");

/**
 * Creates a document to set a friendship
 * @param {String} userId1 The id of the first user
 * @param {String} userId2 The id of the second user
 * @return {*} True if succeeded else throws an error
 */
async function createFriendship(userId1, userId2) {
  return db
      .collection(COLLECTION_FRIENDS)
      .doc(concat(userId1, userId2))
      .set({
        "userIds": [
          db.collection(COLLECTION_USERS).doc(userId1),
          db.collection(COLLECTION_USERS).doc(userId2),
        ],
        "createdAt": Timestamp.now(),
      })
      .then(
          () => { // onSuccess
            return true;
          },
          () => { // onFailed
            throw new functions.https.HttpsError(
                "not-found",
                "Failed to create the friendship.",
            );
          },
      );
}

module.exports = {
  createFriendship,
};
