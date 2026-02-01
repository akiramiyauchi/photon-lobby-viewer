const { db } = require("./firebase");
const admin = require("firebase-admin");

const EXPIRATION_TIME = 20 * 1000; // 20秒以内に更新があった人
const CACHE_DURATION = 20 * 1000;  // 20秒キャッシュ

let cachedData = null;
let lastFetchTime = 0;

exports.handler = async () => {
  try {
    const now = Date.now();

    // キャッシュが有効なら Firestore を読まずに返す
    if (cachedData && now - lastFetchTime < CACHE_DURATION) {
      return { statusCode: 200, body: JSON.stringify({ players: cachedData }) };
    }

    const playersRef = db.collection("rooms").doc("lobby").collection("players");

    const snapshot = await playersRef
      .where("timestamp", ">", admin.firestore.Timestamp.fromMillis(now - EXPIRATION_TIME))
      .get();

    const activePlayers = {};
    const batch = db.batch();
    let needCommit = false;

    snapshot.forEach(doc => {
      const data = doc.data();

      // doc.id が oculusId なので、基本はこれでOK（data.oculusIdが無くても動く）
      const oculusId = doc.id;

      // joinedAt が無ければ初回扱いで付与
      let joinedAt = data.joinedAt;
      if (!joinedAt) {
        joinedAt = admin.firestore.Timestamp.fromMillis(now);
        batch.update(doc.ref, { joinedAt });
        needCommit = true;
      }

      activePlayers[oculusId] = {
        displayName: data.displayName,
        status: data.status,
        level: typeof data.level === "number" ? data.level : "N/A",

        // フロント用
        joinedAt: joinedAt.toMillis ? joinedAt.toMillis() : joinedAt,
      };
    });

    if (needCommit) await batch.commit();

    cachedData = activePlayers;
    lastFetchTime = now;

    return { statusCode: 200, body: JSON.stringify({ players: activePlayers }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Database Error", details: error.message }),
    };
  }
};
