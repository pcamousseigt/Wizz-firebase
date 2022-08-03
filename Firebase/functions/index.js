
const {initializeApp} = require("firebase-admin/app");
initializeApp();

const {functions, db, Timestamp} = require("./db");

const {getUsername} = require("./src/getUsername");
const {setUsername} = require("./src/setUsername");
const {getFriends} = require("./src/getFriends");
const {deleteUserFriendship} = require("./src/deleteUserFriendship");
const {deleteUserFriendships} = require("./src/deleteUserFriendships");
const {deleteUser} = require("./src/deleteUser");
const {getUsersInvited} = require("./src/getUsersInvited");
const {getUsersInvitedMe} = require("./src/getUsersInvitedMe");
const {getUsersFromContacts} = require("./src/getUsersFromContacts");
const {sendInvitation} = require("./src/sendInvitation");
const {withdrawInvitation} = require("./src/withdrawInvitation");
const {acceptInvitation} = require("./src/acceptInvitation");
const {wizz} = require("./src/wizz");
const {COLLECTION_USERS} = require("./src/globals");

/* ===== Triggers ===== */

// Creates a user with the fireAuth id and phone number provided by the user
// At the creation, the phone number is used for the username
// Triggered when the user creates his account
exports.createUser = functions.auth.user()
    .onCreate((user) => {
      return db
          .collection(COLLECTION_USERS)
          .doc(user.uid)
          .set({
            "userId": user.uid,
            "phoneNumber": user.phoneNumber,
            "userName": user.phoneNumber,
            "createdAt": Timestamp.now(),
          });
    });

// Deletes all the user data in the firestore database
// Triggered when the user deletes his account
exports.deleteUser = functions.auth.user()
    .onDelete((user) => {
      const userUid = user.uid;
      if (userUid == undefined) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The user id argument is invalid.",
        );
      }

      // Deletes all the friends of the user
      deleteUserFriendships(userUid)
          .then(() => {
            // If success deletes the user
            return deleteUser(userUid);
          });
    });

/* ===== Functions onCall ===== */

exports.getUsername = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;

      return getUsername(db, userUid);
    });

exports.updateUsername = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const username = data.username;

      return setUsername(userUid, username);
    });

exports.getFriends = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;

      return getFriends(userUid);
    });

exports.deleteFriendship = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const friendId = data.userId;

      return deleteUserFriendship(userUid, friendId);
    });

exports.getUsersInvited = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;

      return getUsersInvited(userUid);
    });

exports.getUsersInvitedMe = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;

      return getUsersInvitedMe(userUid);
    });

exports.getUsersFromContacts = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const phoneNumbers = data.phoneNumbers;

      return getUsersFromContacts(phoneNumbers);
    });

exports.sendInvitation = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const userInvitedId = data.userId;

      return sendInvitation(userUid, userInvitedId);
    });

exports.withdrawInvitation = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const userInvitedId = data.userId;

      return withdrawInvitation(userUid, userInvitedId);
    });

exports.acceptInvitation = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const userInvitedMeId = data.userId;

      return acceptInvitation(userInvitedMeId, userUid);
    });

exports.refuseInvitation = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const userInvitedMeId = data.userId;

      return withdrawInvitation(userInvitedMeId, userUid);
    });

exports.wizz = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const selectedFriendIds = data.selectedFriendsIds;

      return wizz(userUid, selectedFriendIds);
    });

/* ===== Private functions ===== */

/**
 * Checks all the security concerns of the request
 * @param {context} context The context of the request
 */
function securityChecks(context) {
  // context.app will be undefined if the request doesn't include an
  // App Check token. If the request includes an invalid App Check
  // token, the request will be rejected with HTTP error 401.
  if (context.app == undefined) {
    // You can inspect the raw request header to check whether an App
    // Check token was provided in the request.
    const rawToken = context.rawRequest.header["X-Firebase-AppCheck"];
    if (rawToken == undefined) {
      /*  throw new functions.https.HttpsError(
          "failed-precondition",
          "The function must be called from an App Check verified app."
      );*/
    } else {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "Provided App Check token failed to validate.",
      );
    }
  }
}

/**
 * Checks all the auth concerns of the request
 * @param {context} context The context of the request
 */
function authChecks(context) {
  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called while authenticated.",
    );
  }

  if (!context.auth.uid) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The server failed to find user id.",
    );
  }
}
