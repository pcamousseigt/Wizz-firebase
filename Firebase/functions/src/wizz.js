
/**
 * Creates wizz documents
 * @param {String} userId1 The id of the user who wizz
 * @param {Array} userIds The ids of the users to wizz
 * @return {*} True if succeeded else throws an error
 */
async function wizz(userId1, userIds) {
  console.log("userId1:" + userId1);
  console.log("userId2:" + userIds);

  return true;
}

module.exports = {
  wizz,
};
