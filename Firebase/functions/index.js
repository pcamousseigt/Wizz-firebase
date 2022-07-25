
const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

/* ===== Constants ===== */

const COLLECTION_USERS = "users";
const COLLECTION_FRIENDS = "friends";
const COLLECTION_INVITATIONS = "invitations";
const BATCH_SIZE = 10;

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
            "timestamp": Timestamp.now(),
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

      return getUsername(userUid);
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

exports.sendInvitation = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const userInvitedId = data.userId;

      return sendInvitation(userUid, userInvitedId);
    });

exports.getUsersInvited = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;

      return getUsersInvited(userUid);
    });

exports.withdrawInvitation = functions
    .https.onCall((data, context) => {
      securityChecks(context);
      authChecks(context);

      const userUid = context.auth.uid;
      const userInvitedId = data.userId;

      return withdrawInvitation(userUid, userInvitedId);
    });

/* ===== Private functions ===== */

/**
 * Concatenates two strings by comparing the alphabetic orders of two strings
 * @param {String} str1 The first string to concatenate
 * @param {String} str2 The second string to concatenate
 * @return {String} The concatenated string with a separator
 */
function concat(str1, str2) {
  const SEPARATOR = "_";
  if (str1.localeCompare(str2)) {
    // If str1 > str2
    return str1.concat(SEPARATOR, str2);
  }
  // Else if str1 <= str2
  return str2.concat(SEPARATOR, str1);
}

/**
 * Gets the username of a user
 * @param {String} userUid The id of the user requested
 * @return {String|null} If the user exists the username else null
 */
async function getUsername(userUid) {
  return db
      .collection(COLLECTION_USERS)
      .where("userId", "==", userUid)
      .get()
      .then(
          (snapshot) => {
            // Convert the snapshot query into requested values
            const username = getFieldValueFromFirstDoc(snapshot, "userName");
            return {response: username};
          })
      .catch(
          (error) => {
            console.log("Error trying to get username.");
            return {response: null};
          },
      );
}

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
      .update({userName: username})
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

/**
 * Gets the friends of a user
 * @param {String} userUid The user identifier whose friendships are requested
 * @return {Array} The array of friends or throws an exception
 */
async function getFriends(userUid) {
  const userRef = db.collection(COLLECTION_USERS).doc(userUid);
  return db
      .collection(COLLECTION_FRIENDS)
      .where("userIds", "array-contains", userRef)
      .get()
      .then(
          (snapshot) => {
            const promises = getFriendRefs(snapshot, userRef);
            return Promise.allSettled(promises)
                .then((results) => {
                  const friends = getDataArrayFromFulfilledPromises(results);
                  return {response: friends};
                });
          })
      .catch(
          (error) => {
            console.log("Error trying to get friendships: "+error);
            return {response: []};
          },
      );
}

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
}

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
                    getDataArrayFromFulfilledPromises(results);
                  return {response: usersInvited};
                });
          })
      .catch(
          (error) => {
            console.log("Error trying to get users invited:"+error);
            return {response: []};
          },
      );
}

/**
 * Withdraws an invitation sent to a user
 * @param {String} currentUserUid The current user identifier
 * @param {String} userInvitedUid The identifier of the user from whom
 * to withdraw the invitation
 * @return {Boolean} True if withdrawn else throws an exception
 */
async function withdrawInvitation(currentUserUid, userInvitedUid) {
  const currUserRef = db.collection(COLLECTION_USERS).doc(currentUserUid);
  const userInvitedRef = db.collection(COLLECTION_USERS).doc(userInvitedUid);

  const invitationsRef = db
      .collection(COLLECTION_INVITATIONS)
      .where("from", "==", currUserRef)
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

/**
 * Gets the promises of friend objects of the current user
 * @param {QuerySnapshot} snapshot The snapshot containing the documents
 * @param {DocumentReference} currentUserRef The current user requesting
 * the friendships
 * @return {Array} The array of promises of user objects
 */
function getFriendRefs(snapshot, currentUserRef) {
  const values = [];

  if (snapshot.empty) {
    console.log("No matching documents.");
    return values;
  }

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const userRefs = data["userIds"];
    userRefs.forEach((userRef) => {
      if (userRef.id != currentUserRef.id) {
        values.push(userRef.get());
      }
    });
  });

  return values;
}

/**
 * Gets the promises of invited user objects
 * @param {QuerySnapshot} snapshot The snapshot containing the documents
 * @return {Array} The array of promises of user objects
 */
function getUserInvitedRefs(snapshot) {
  const values = [];

  if (snapshot.empty) {
    console.log("No matching documents.");
    return values;
  }

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const userRef = data["to"];
    values.push(userRef.get());
  });

  return values;
}

/**
 * Gets a field value from the first document of a simple snapshot response
 * @param {QuerySnapshot} snapshot The query snapshot containing the documents
 * @param {String} fieldName The name of the field
 * @return {*|Null} The value of the field or null if the field does not exists
 */
function getFieldValueFromFirstDoc(snapshot, fieldName) {
  if (snapshot.empty) {
    console.log("No matching documents.");
    return {response: null};
  }

  // Gets the first document of the snapshot
  const doc = snapshot.docs[0];
  // Gets the value of the field
  const value = doc.get(fieldName);
  if (value != undefined) {
    return value;
  }

  return null;
}

/**
 * Gets the data from a document snapshot
 * @param {QueryDocumentSnapshot} snapshot The document snapshot
 * @return {Object} The data from the document snapshot
 */
function getDataFromDocument(snapshot) {
  if (!snapshot.exists) {
    console.log("No matching documents.");
    return null;
  }
  return snapshot.data();
}

/**
 * Gets the data of all fulfilled promises
 * @param {Array} promises The array of promises
 * @return {Array} The array of data extracted from each fulfilled promises
 */
function getDataArrayFromFulfilledPromises(promises) {
  const dataArray = [];
  promises.forEach((result) => {
    if (result.status === "fulfilled") {
      const data = getDataFromDocument(result.value);
      if (data != null) {
        dataArray.push(data);
      }
    }
  });
  return dataArray;
}

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

/**
 * Deletes documents
 * @param {Firestore} db The databse to use to execute the request
 * @param {QueryDocumentSnapshot} documentRefs The documents to delete
 * @param {Int} batchSize The maximum size of the batch
 * @return {Promise} The promise of deleting the documents
 */
async function deleteDocuments(db, documentRefs, batchSize) {
  const query = documentRefs.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

/**
 * Deletes the response of the query depending on batch size
 * in order to avoid memory problems
 * @param {Firestore} db The database to use to execute the request
 * @param {*} query The reference of documents to delete
 * @param {*} resolve The function executed when finished
 * @return {undefined} Nothing
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
