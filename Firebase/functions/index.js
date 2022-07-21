
const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, /* , Timestamp, DocumentReference*/
} = require("firebase-admin/firestore");

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
          .doc(userUid)
          .set({
            "from": userUid,
            "to": userInvitedId,
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

/* ===== Private functions ===== */

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
            const valuesIds = getFieldValuesFromSnapshot(snapshot);
            // The response must not contains current user id doing the request
            const friendIds = valuesIds.filter((userId) => userId != userUid);
            // Get all friends' phone numbers thanks to their ids
            return getFriendsFromIds(friendIds)
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
async function getFriendsFromIds(friendsIds) {
  return db
      .collection(COLLECTION_NAME_USERS)
      .where("userId", "in", friendsIds)
      .get();
}

/**
 * Transforms a snapshot response into an array
 * @param {QuerySnapshot} snapshot The docs in snapshots
 * @return {Array} The array of data from the snapshots
 */
function getFieldValuesFromSnapshot(snapshot) {
  const values = [];

  if (snapshot.empty) {
    console.log("No matching documents.");
    return {response: values};
  }

  snapshot.docs.forEach((doc) => {
    const fields = doc.data();
    const arrayOfFields = fields["userIds"];
    arrayOfFields.forEach((userIds) => {
      values.push(userIds);
    });
  });
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
