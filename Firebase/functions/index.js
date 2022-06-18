const functions = require("firebase-functions");

const admin = require("firebase-admin");

admin.initializeApp();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

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
              "Provided App Check token failed to validate."
          );
        }
      }

      functions.logger.info("Hello logs!", {structuredData: true});
      return {response: "Hello from Firebase!"};
    });

const COLLECTION_NAME_USERS = "users";

exports.createUser = functions.auth.user()
    .onCreate((user) => {
      return admin
          .firestore()
          .collection(COLLECTION_NAME_USERS)
          .doc(user.uid)
          .set(JSON.parse(JSON.stringify({
            "userId": user.uid,
            "phoneNumber": user.phoneNumber,
          })));
    });
