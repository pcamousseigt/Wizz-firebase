
const functions = require("firebase-functions");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");
const db = getFirestore();


module.exports = {
  functions,
  Timestamp,
  db,
};
