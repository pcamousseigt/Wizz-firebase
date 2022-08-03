
const {db} = require("./../db");
const {COLLECTION_USERS, COLLECTION_INVITATIONS} = require("./globals");
const {getUserInvitedRefs} = require("./getUserInvitedRefs");
const {getDataArrayFromQueryDocumentSnapshotPromises} =
    require("./getDataArrayFromQueryDocumentSnapshotPromises");

/**
 * Get all the users invited
 * @param {String} userUid The user who invited
 * @return {Array} The array of users invited
 */
async function getUsersInvited(userUid) {
  const userRef = db.collection(COLLECTION_USERS).doc(userUid);
  return db
      .collection(COLLECTION_INVITATIONS)
      .where("from", "==", userRef)
      .get()
      .then(
          (snapshot) => {
            // Gets an array of promises of user invited references
            const promises = getUserInvitedRefs(snapshot, userRef);
            // Waits for all promises in the array to finish
            return Promise.allSettled(promises)
                .then((results) => {
                  // Gets an array of user objects from finished promises
                  const usersInvited =
                    getDataArrayFromQueryDocumentSnapshotPromises(
                        results,
                        "fulfilled",
                    );
                  return {response: usersInvited};
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
  getUsersInvited,
};
