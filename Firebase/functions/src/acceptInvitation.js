
const {withdrawInvitation} = require("./withdrawInvitation");
const {createFriendship} = require("./createFriendship");

/**
 * Accepts an invitation from a user.
 * The invitation object is deleted and a friend object is created.
 * @param {String} userSenderUid The id of the sender user from whom
 * to accept the invitation
 * @param {String} userInvitedUid The id of the user who has been invited
 * @return {Boolean} True if the friendship is created else false
 */
async function acceptInvitation(userSenderUid, userInvitedUid) {
  const withdrawPromise = withdrawInvitation(userSenderUid, userInvitedUid);
  return withdrawPromise
      .then(() => { // onSuccess
        const createdPromise = createFriendship(userSenderUid, userInvitedUid);
        createdPromise
            .then(() => { // onSuccess
              return {response: true};
            },
            )
            .catch((error) => {
              console.log("Error trying to create the friendship:" + error);
              return {response: false};
            },
            );
      })
      .catch(
          (error) => {
            console.log("Error trying to withdraw invitation:" + error);
            return {response: false};
          },
      );
}

module.exports = {
  acceptInvitation,
};
