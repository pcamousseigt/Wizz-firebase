
const {functions, db} = require("./../db");
const {COLLECTION_FRIENDS} = require("./globals");
const {concat} = require("./concat");

/**
 * Deletes a user friendship
 * @param {String} currUserId The user id whose the friendship has to be deleted
 * @param {String} friendId The user id to unfriend
 * @return {Boolean} True if the user friendship has been deleted
 * or throws an exception
 */
async function deleteUserFriendship(currUserId, friendId) {
  return db
      .collection(COLLECTION_FRIENDS)
      .doc(concat(currUserId, friendId))
      .delete()
      .then(
          () => { // onSuccess
            return true;
          },
          () => { // onFailed
            throw new functions.https.HttpsError(
                "not-found",
                "Failed to delete the user friendship.",
            );
          },
      );
}

module.exports = {
  deleteUserFriendship,
};
