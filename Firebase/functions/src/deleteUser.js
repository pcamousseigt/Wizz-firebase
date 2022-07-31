
// const functions = require("firebase-functions");
// import {db} from "./../db";
// import {functions} from "./../index";
const {functions, db} = require("./../db");
const {COLLECTION_USERS} = require("./globals");

/**
 * Deletes a user
 * @param {String} userUid The identifier of the user to delete
 * @return {*} The response if the user has been deleted or throws an exception
 */
async function deleteUser(userUid) {
  return db
      .collection(COLLECTION_USERS)
      .doc(userUid)
      .delete()
      .then(
          () => { // onSuccess
            return {response: "User has been deleted !"};
          },
          () => { // onFailed
            throw new functions.https.HttpsError(
                "not-found",
                "Failed to delete the user.",
            );
          },
      );
}

module.exports = {
  deleteUser,
};
