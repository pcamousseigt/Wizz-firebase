
const {deleteQueryBatch} = require("./deleteQueryBatch");

/**
 * Deletes documents
 * @param {Firestore} db The database instance to use to execute the request
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

module.exports = {
  deleteDocuments,
};
