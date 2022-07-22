
const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

/* ===== Constants ===== */

const COLLECTION_NAME_USERS = "users";
const COLLECTION_NAME_FRIENDS = "friends";
const COLLECTION_NAME_INVITATIONS = "invitations";
const BATCH_SIZE = 10;

/* ===== Triggers ===== */

// Creates a user with the fireAuth id and phone number provided by the user
// Triggered when the user creates his account
exports.createUser = functions.auth.user()
    .onCreate((user) => {
      return db
          .collection(COLLECTION_NAME_USERS)
          .doc(user.uid)
          .set({
            "userId": user.uid,
            "phoneNumber": user.phoneNumber,
            "userName": user.phoneNumber,
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

      deleteUserFriendships(userUid)
          .then(
              () => {
                return deleteUser(userUid);
              });
    });

/* ===== Functions onCall ===== */

exports.getUsername = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;

      return getUsername(userUid);
    });

exports.getFriends = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;

      return getFriends(userUid);
    });

exports.sendInvitation = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const userInvitedId = data.userId;

      return db
          .collection(COLLECTION_NAME_INVITATIONS)
          .doc(createDocumentName(userUid, userInvitedId))
          .set({
            "from": userUid,
            "to": userInvitedId,
            "timestamp": Timestamp.now(),
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
    });

exports.getInvitationsSent = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      return getInvitationsSent(userUid);
    });

/* ===== Private functions ===== */

/**
 * Generates a document name by comparing the alphabetic orders of two strings
 * @param {String} str1 The first string
 * @param {String} str2 The second string
 * @return {String} The document name generated
 */
function createDocumentName(str1, str2) {
  const SEPARATOR = "_";
  if (str1.localeCompare(str2)) {
    // If str1 > str2
    return str1.concat(SEPARATOR, str2);
  }
  // Else if str1 <= str2
  return str2.concat(SEPARATOR, str1);
}

/**
 * Get all the users invited
 * @param {String} userUid The user who invited
 * @return {List} The list of users invited
 */
async function getInvitationsSent(userUid) {
  return db
      .collection(COLLECTION_NAME_INVITATIONS)
      .where("from", "==", userUid)
      .get()
      .then(
          (snapshot) => {
            // Convert the snapshot query into requested values
            const userIds = getFieldValuesFromArraySnapshot(snapshot, "to");
            return getUsersFromIds(userIds)
                .then(
                    (snapshot) => {
                      const usersInvited = getDocsFromSnapshot(snapshot);
                      return {response: usersInvited};
                    })
                .catch(
                    (error) => {
                      console.log("Error trying to get friends.");
                      return {response: []};
                    },
                );
          })
      .catch(
          (error) => {
            console.log("Error trying to get users invited.");
            return {response: []};
          },
      );
}

/**
 * Gets the username of a user
 * @param {String} userUid The id of the user requested
 * @return {*} The username
 */
async function getUsername(userUid) {
  return db
      .collection(COLLECTION_NAME_USERS)
      .where("userId", "==", userUid)
      .get()
      .then(
          (snapshot) => {
            // Convert the snapshot query into requested values
            const username = getFieldValueFromSnapshot(snapshot, "userName");
            return {response: username};
          })
      .catch(
          (error) => {
            console.log("Error trying to get username.");
            return {response: []};
          },
      );
}

/**
 * Gets the friendships of a user
 * @param {String} userUid The user whose friendships are requested
 * @return {*} The friendships
 */
async function getFriends(userUid) {
  return db
      .collection(COLLECTION_NAME_FRIENDS)
      .where("userIds", "array-contains", userUid)
      .get()
      .then(
          (snapshot) => {
            // Convert the snapshot query into requested values
            const uids = getFieldValuesFromArraySnapshot(snapshot, "userIds");
            // The response must not contains current user id doing the request
            const friendIds = uids.filter((userId) => userId != userUid);
            // Get all friends' phone numbers thanks to their ids
            return getUsersFromIds(friendIds)
                .then(
                    (snapshot) => {
                      const friends = getDocsFromSnapshot(snapshot);
                      return {response: friends};
                    })
                .catch(
                    (error) => {
                      console.log("Error trying to get friends.");
                      return {response: []};
                    },
                );
          })
      .catch(
          (error) => {
            console.log("Error trying to get friendships.");
            return {response: []};
          },
      );
}

/**
 * Returns friends from their ids
 * @param {Array} friendsIds The array of friends ids
 * @return {Array} An array of friends with their ids and phone numbers
 */
async function getUsersFromIds(friendsIds) {
  return db
      .collection(COLLECTION_NAME_USERS)
      .where("userId", "in", friendsIds)
      .get();
}

/**
 * Transforms a snapshot of an array response into an array
 * @param {QuerySnapshot} snapshot The docs in snapshots
 * @param {String} fieldName The name of the field
 * @return {Array} The array of data from the snapshots
 */
function getFieldValuesFromArraySnapshot(snapshot, fieldName) {
  const values = [];

  if (snapshot.empty) {
    console.log("No matching documents.");
    return {response: values};
  }

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    console.log(data);
    const arrayOfFields = data[fieldName];
    arrayOfFields.forEach((field) => {
      values.push(field);
    });
  });
  return values;
}

/**
 * Transforms a simple snapshot response into an array
 * @param {QuerySnapshot} snapshot The docs in snapshots
 * @param {String} fieldName The name of the field
 * @return {Array} The array of data from the snapshots
 */
function getFieldValueFromSnapshot(snapshot, fieldName) {
  const values = [];

  if (snapshot.empty) {
    console.log("No matching documents.");
    return {response: values};
  }

  const doc = snapshot.docs[0];
  const value = doc.get(fieldName);
  if (value != undefined) {
    values.push(value);
  }
  return values;
}

/**
 * Transforms a snapshot response into an array of documents
 * @param {QuerySnapshot} snapshot The documents in the snapshot
 * @return {*} The documents from the snapshot
 */
function getDocsFromSnapshot(snapshot) {
  if (snapshot.empty) {
    console.log("No matching documents.");
    return {response: []};
  }

  const arrayOfDocs = [];
  snapshot.docs.forEach((doc) => {
    arrayOfDocs.push(doc.data());
  });
  return arrayOfDocs;
}

/**
 * Deletes all user friendships
 * @param {String} userUid The user whose friendships should be deleted.
 * @return {*} The response if the user friendships have been deleted
 * or throws an exception
 */
async function deleteUserFriendships(userUid) {
  const friendsDocsRef = db
      .collection(COLLECTION_NAME_FRIENDS)
      .where("userIds", "array-contains", userUid);

  return deleteDocument(db, friendsDocsRef, BATCH_SIZE)
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

/**
 * Deletes the user
 * @param {String} userUid The user to delete.
 * @return {*} The response if the user has been deleted or throws an exception
 */
async function deleteUser(userUid) {
  return db
      .collection(COLLECTION_NAME_USERS)
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

/**
 * Deletes documents
 * @param {Firestore} db The databse to use to execute the request
 * @param {DocumentReference} documentRef The documents to delete
 * @param {Int} batchSize The maximum size of the batch
 * @return {*} TO DO
 */
async function deleteDocument(db, documentRef, batchSize) {
  const query = documentRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

/**
 * Deletes the response of the query depending on batch size
 * in order to avoid memory problems
 * @param {Firestore} db The databse to use to execute the request
 * @param {*} query TO DO
 * @param {*} resolve TO DO
 * @return {*} TO DO
 */
async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

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
