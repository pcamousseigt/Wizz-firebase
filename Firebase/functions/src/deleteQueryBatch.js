
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

module.exports = {
  deleteQueryBatch,
};
