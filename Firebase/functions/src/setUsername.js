
const {functions, db, Timestamp} = require("./../db");
const {COLLECTION_USERS} = require("./globals");

/**
 * Update the username of a user
 * @param {String} userUid The id of the user requested
 * @param {String} username The new username
 * @return {Boolean|HttpsError} True if updated else throws an error
 */
async function setUsername(userUid, username) {
  return db
      .collection(COLLECTION_USERS)
      .doc(userUid)
      .update({userName: username, modifiedAt: Timestamp.now()})
      .then(() => {
        return true;
      })
      .catch(
          (error) => {
            throw new functions.https.HttpsError(
                "not-found",
                "Failed to update the username.",
            );
          },
      );
}

module.exports = {
  setUsername,
};
