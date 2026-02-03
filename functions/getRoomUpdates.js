const { db } = require("./firebase");
const admin = require("firebase-admin");

const EXPIRATION_TIME = 20 * 1000;  // 20秒以内更新
const CACHE_DURATION = 20 * 1000;

let cachedData = null;
let lastFetchTime = 0;

exports.handler = async (event) => {
  try {
    const now = Date.now();

    // キャッシュ有効ならそのまま返す
    if (cachedData && now - lastFetchTime < CACHE_DURATION) {
      return {
        statusCode: 200,
        body: JSON.stringify({ players: cachedData })
      };
    }

    const playersRef = db
      .collection("rooms")
      .doc("lobby")
      .collection("players");

    const snapshot = await playersRef
      .where(
        "timestamp",
        ">",
        admin.firestore.Timestamp.fromMillis(now - EXPIRATION_TIME)
      )
      .get();

    const activePlayers = {};

    snapshot.forEach(doc => {
      const data = doc.data();

      activePlayers[doc.id] = {
        displayName: data.displayName,
        status: data.status,
        level: typeof data.level === "number" ? data.level : "N/A",

        // 🔥 Timestamp → ミリ秒へ変換
        enteredAt: data.enteredAt
          ? data.enteredAt.toMillis()
          : null
      };
    });

    cachedData = activePlayers;
    lastFetchTime = now;

    return {
      statusCode: 200,
      body: JSON.stringify({ players: activePlayers })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
