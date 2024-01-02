const admin = require("firebase-admin");

const serviceAccount = require("../../testing-ab1f1-firebase-adminsdk-szxcx-db25a0c21c.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

module.exports.admin = admin