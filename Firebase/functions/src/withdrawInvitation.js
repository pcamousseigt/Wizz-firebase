
const {functions, db} = require("./../db");
const {
  COLLECTION_USERS,
  COLLECTION_INVITATIONS,
  BATCH_SIZE,
} = require("./globals");
const {deleteDocuments} = require("./deleteDocuments");

/**
 * Withdraws an invitation sent to a user
 * @param {String} userSenderId The id of the user who sent the invitation
 * @param {String} userInvitedId The id of the user who received the invitation
 * @return {Boolean} True if withdrawn else throws an exception
 */
async function withdrawInvitation(userSenderId, userInvitedId) {
  const userSenderRef = db.collection(COLLECTION_USERS).doc(userSenderId);
  const userInvitedRef = db.collection(COLLECTION_USERS).doc(userInvitedId);

  const invitationsRef = db
      .collection(COLLECTION_INVITATIONS)
      .where("from", "==", userSenderRef)
      .where("to", "==", userInvitedRef);

  return deleteDocuments(db, invitationsRef, BATCH_SIZE)
      .then(
          () => { // onSuccess
            return true;
          },
          () => { // onFailed
            throw new functions.https.HttpsError(
                "not-found",
                "Failed to withdraw the invitation.",
            );
          },
      );
}

module.exports = {
  withdrawInvitation,
};
