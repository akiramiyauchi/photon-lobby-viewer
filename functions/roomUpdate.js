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

    const { oculusId } = body;
    if (!oculusId) {
      return { statusCode: 400, body: "Missing oculusId" };
    }

    const playerRef = db
      .collection("rooms")
      .doc("lobby")
      .collection("players")
      .doc(oculusId);

    const updateData = {
      oculusId,
      timestamp: admin.firestore.Timestamp.now(),
    };

    // 送られてきた値だけ反映（undefinedで潰さない）
    if (typeof body.displayName === "string") updateData.displayName = body.displayName;
    if (typeof body.status === "string") updateData.status = body.status;
    if (typeof body.level === "number") updateData.level = body.level;

    // lobbyJoinedAt は lobby のときだけ更新（数値として妥当な時だけ）
    const joinedAtMs = Number(body.lobbyJoinedAt);
    if (body.status === "lobby" && Number.isFinite(joinedAtMs) && joinedAtMs > 0) {
      updateData.lobbyJoinedAt = admin.firestore.Timestamp.fromMillis(joinedAtMs);
    }

    await playerRef.set(updateData, { merge: true });

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
