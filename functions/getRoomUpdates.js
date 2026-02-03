const { db } = require("./firebase");
const admin = require("firebase-admin");

const EXPIRATION_TIME = 20 * 1000;

exports.handler = async (event) => {
  try {
    const now = Date.now();
    const mode = event.queryStringParameters?.mode || "lobby";

    let query = db
      .collection("rooms")
      .doc("lobby")
      .collection("players")
      .where(
        "timestamp",
        ">",
        admin.firestore.Timestamp.fromMillis(now - EXPIRATION_TIME)
      );

    // 🔥 ロビー専用表示
    if (mode === "lobby") {
      query = query.where("status", "==", "lobby");
    }

    const snapshot = await query.get();

    const players = {};

    snapshot.forEach(doc => {
      const data = doc.data();

      players[doc.id] = {
        displayName: data.displayName,
        status: data.status,
        level: data.level,
        lobbyJoinedAt: data.lobbyJoinedAt
          ? data.lobbyJoinedAt.toMillis()
          : null
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ players })
    };
  }
  catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
