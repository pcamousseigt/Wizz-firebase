
const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, /* , Timestamp, DocumentReference*/
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

/* ===== Constants ===== */

const COLLECTION_NAME_USERS = "users";
const COLLECTION_NAME_FRIENDS = "friends";
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

exports.helloWorld = functions
    .https.onCall((data, context) => {
      // context.app will be undefined if the request doesn't include an
      // App Check token. (If the request includes an invalid App Check
      // token, the request will be rejected with HTTP error 401.)
      if (context.app == undefined) {
        // You can inspect the raw request header to check whether an App
        // Check token was provided in the request. If you're not ready to
        // fully enable App Check yet, you could log these conditions instead
        // of throwing errors.
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

      functions.logger.info("Hello logs!", {structuredData: true});
      return {response: "Hello from Firebase!"};
    });

/* ===== Private functions ===== */

/**
 * Deletes user friendships
 * @param {userUid} userUid The user whose friendships should be deleted.
 * @return {*} The response if the user friendships have been deleted
 * or throws an exception
 */
async function deleteUserFriendships(userUid) {
  // deletes all friendships of the user

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
 * @param {userUid} userUid The user to delete.
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
