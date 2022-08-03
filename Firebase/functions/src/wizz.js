
const {functions, db, Timestamp} = require("./../db");
const {COLLECTION_USERS, COLLECTION_WIZZ} = require("./globals");
const {getFriendIds} = require("./getFriends");

/**
 * Creates wizz documents
 * It means sendings of a wizz to multiple users
 * @param {String} userId1 The id of the user who wizz
 * @param {Array} userIds The ids of the users to wizz
 * @return {*} True if succeeded else throws an error
 */
async function wizz(userId1, userIds) {
  let friendIds = [];
  // To avoid the user to send some wizz to a user who is not a friend
  // 1. The list of ids of the user's friends is loaded
  await Promise.allSettled([getFriendIds(userId1)])
      .then((results) => {
        results.forEach((result) => {
          if (result.status == "fulfilled") {
            friendIds = result.value;
          }
        });
      })
      .catch((error) => { // If not loaded the execution stops
        throw new functions.https.HttpsError(
            "unknown",
            "Failed to get the friend identifiers: " + error,
        );
      });

  // 2. Remove ids of users not being in the list of ids of the user's friends
  const realUserIds = userIds.filter((userId) => friendIds.includes(userId));

  // 3. Create documents to send wizz
  const promises = [];
  realUserIds.forEach((userId) => {
    promises.push(sendWizzTo(userId1, userId));
  });

  // 4. Return the list of ids of users for whom the sending of wizz worked
  return Promise.allSettled(promises)
      .then((results) => {
        const usersWizzed = [];
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            // result.value is an id in String format
            usersWizzed.push(result.value);
          }
        });
        return {response: usersWizzed};
      })
      .catch((error) => { // If an error the execution stops
        throw new functions.https.HttpsError(
            "unknown",
            "Failed to send wizz to friends: " + error,
        );
      });
}

module.exports = {
  wizz,
};

/**
 * Creates a wizz document
 * It means a sending of a wizz
 * @param {String} userId1 The id of the user who wizz
 * @param {Array} userId2 The id of the user to wizz
 * @return {*} True if succeeded else throws an error
 */
async function sendWizzTo(userId1, userId2) {
  return db
      .collection(COLLECTION_WIZZ)
      .add({
        "from": db.collection(COLLECTION_USERS).doc(userId1),
        "to": db.collection(COLLECTION_USERS).doc(userId2),
        "createdAt": Timestamp.now(),
      })
      .then(
          () => { // onSuccess
            return userId2;
          },
          () => { // onFailed
            throw new functions.https.HttpsError(
                "not-found",
                "Failed to send a wizz.",
            );
          },
      );
}
