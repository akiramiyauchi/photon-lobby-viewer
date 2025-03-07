const admin = require("firebase-admin");

// Firebase の秘密鍵 JSON を環境変数から取得
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { db };
