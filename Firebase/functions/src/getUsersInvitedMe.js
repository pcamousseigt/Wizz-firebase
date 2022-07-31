// import {db} from "./../db";
const {db} = require("./../db");
const {COLLECTION_USERS, COLLECTION_INVITATIONS} = require("./globals");
const {getUserInvitedMeRefs} = require("./getUserInvitedMeRefs");
const {getDataArrayFromQueryDocumentSnapshotPromises} =
    require("./getDataArrayFromQueryDocumentSnapshotPromises");

/**
 * Get all the users who invited me
 * @param {String} userUid The user who has been invited
 * @return {Array} The array of users who invited me
 */
async function getUsersInvitedMe(userUid) {
  const userRef = db.collection(COLLECTION_USERS).doc(userUid);
  return db
      .collection(COLLECTION_INVITATIONS)
      .where("to", "==", userRef)
      .get()
      .then(
          (snapshot) => {
            // Gets an array of promises of user invited references
            const promises = getUserInvitedMeRefs(snapshot, userRef);
            // Waits for all promises in the array to finish
            return Promise.allSettled(promises)
                .then((results) => {
                  // Gets an array of user objects from finished promises
                  const usersInvitedMe =
                    getDataArrayFromQueryDocumentSnapshotPromises(
                        results,
                        "fulfilled",
                    );
                  return {response: usersInvitedMe};
                });
          })
      .catch(
          (error) => {
            console.log("Error trying to get users invited:" + error);
            return {response: []};
          },
      );
}

module.exports = {
  getUsersInvitedMe,
};
