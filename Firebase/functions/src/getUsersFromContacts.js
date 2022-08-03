
const {db} = require("./../db");
const {COLLECTION_USERS} = require("./globals");
const {getDataArrayFromQuerySnapshotPromises} =
    require("./getDataArrayFromQuerySnapshotPromises");

/**
 * Get all the users from an array of phone numbers
 * @param {Array} phoneNumbers The array of phone numbers
 * @return {Array} An array of user objects
 */
async function getUsersFromContacts(phoneNumbers) {
  // Do not run if there aren't any phoneNumbers
  if (!phoneNumbers || !phoneNumbers.length) return {response: []};

  const collectionPath = db.collection(COLLECTION_USERS);
  const batches = [];

  while (phoneNumbers.length) {
    // Firestore limits batches to 10
    const batch = phoneNumbers.splice(0, 10);

    // Add the batch request to a queue
    batches.push(collectionPath.where("phoneNumber", "in", [...batch]).get());
  }

  return Promise.allSettled(batches)
      .then((results) => {
        const users = getDataArrayFromQuerySnapshotPromises(
            results,
            "fulfilled",
        );
        return {response: users};
      });
}

module.exports = {
  getUsersFromContacts,
};
