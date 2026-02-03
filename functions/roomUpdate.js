const { db } = require("./firebase");
const admin = require("firebase-admin");

const SECRET_KEY = "MySecretKey123";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);

    if (body.secret !== SECRET_KEY) {
      return { statusCode: 403, body: "Forbidden" };
    }

    const {
      oculusId,
      displayName,
      status,
      level,
      lobbyJoinedAt
    } = body;

    if (!oculusId) {
      return { statusCode: 400, body: "Missing oculusId" };
    }

    const playerRef = db
      .collection("rooms")
      .doc("lobby")
      .collection("players")
      .doc(oculusId);

    const now = admin.firestore.Timestamp.now();

    const updateData = {
      oculusId,
      displayName,
      status,
      level,
      timestamp: now
    };

    // 🔥 lobbyJoinedAt は lobby 状態のときだけ更新
    if (status === "lobby" && lobbyJoinedAt) {
      updateData.lobbyJoinedAt =
        admin.firestore.Timestamp.fromMillis(lobbyJoinedAt);
    }

    await playerRef.set(updateData, { merge: true });

    return { statusCode: 200, body: "OK" };
  }
  catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
