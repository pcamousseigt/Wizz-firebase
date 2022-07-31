
const {COLLECTION_USERS} = require("./globals");
const {getFieldValueFromFirstDoc} = require("./getFieldValueFromFirstDoc");

/**
 * Gets the username of a user
 * @param {Firestore} db The database instance
 * @param {String} userUid The id of the user requested
 * @return {String|null} If the user exists the username else null
 */
async function getUsername(db, userUid) {
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
            console.log("Error trying to get username:" + error);
            return {response: null};
          },
      );
}

module.exports = {
  getUsername,
};
