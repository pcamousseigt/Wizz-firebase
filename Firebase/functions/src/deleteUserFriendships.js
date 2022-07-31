
// const functions = require("firebase-functions");
// import {db} from "./../db";
// import {functions} from "./../index";
const {functions, db} = require("./../db");
const {COLLECTION_FRIENDS, BATCH_SIZE} = require("./globals");
const {deleteDocuments} = require("./deleteDocuments");

/**
 * Deletes all user friendships
 * @param {String} userUid The user id whose friendships have to be deleted
 * @return {*} The response if the user friendships have been deleted
 * or throws an exception
 */
async function deleteUserFriendships(userUid) {
  const friendsDocRefs = db
      .collection(COLLECTION_FRIENDS)
      .where("userIds", "array-contains", userUid);

  return deleteDocuments(db, friendsDocRefs, BATCH_SIZE)
      .then(
          () => { // onSuccess
            return {response: "User friendships are now deleted !"};
          },
          () => { // onFailed
            throw new functions.https.HttpsError(
                "not-found",
                "Failed to delete user friendships.",
            );
          },
      );
}

module.exports = {
  deleteUserFriendships,
};
