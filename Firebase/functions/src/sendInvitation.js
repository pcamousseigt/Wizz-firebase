
const {functions, db, Timestamp} = require("./../db");
const {COLLECTION_USERS, COLLECTION_INVITATIONS} = require("./globals");
const {concat} = require("./concat");

/**
 * Creates a document to set an invitation
 * @param {String} fromUserId The id of the user sending the invitation
 * @param {String} toUserId The id of the user invited
 * @return {*} A response if succeeded else throws an error
 */
async function sendInvitation(fromUserId, toUserId) {
  return db
      .collection(COLLECTION_INVITATIONS)
      .doc(concat(fromUserId, toUserId))
      .set({
        "from": db.collection(COLLECTION_USERS).doc(fromUserId),
        "to": db.collection(COLLECTION_USERS).doc(toUserId),
        "createdAt": Timestamp.now(),
      })
      .then(
          () => { // onSuccess
            return {response: "Invitation sent!"};
          },
          () => { // onFailed
            throw new functions.https.HttpsError(
                "not-found",
                "Failed to send the invitation.",
            );
          },
      );
}

module.exports = {
  sendInvitation,
};
