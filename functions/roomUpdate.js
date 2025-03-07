const { db } = require("./firebase");
const admin = require("firebase-admin");

const SECRET_KEY = "MySecretKey123";

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return { statusCode: 400, body: "Invalid JSON" };
    }

    if (body.secret !== SECRET_KEY) {
        return { statusCode: 403, body: "Forbidden" };
    }

    // 🔹 必要なデータがすべて送信されているかチェック
    if (!body.oculusId || !body.displayName || !body.status) {
        return { statusCode: 400, body: "Missing required fields" };
    }

    const playerRef = db.collection("rooms").doc("lobby").collection("players").doc(body.oculusId);

    // 🔹 Firestore の `serverTimestamp()` を使用
    const playerData = {
        oculusId: body.oculusId, // 🔹 キーとして使う ID を最初に定義
        displayName: body.displayName,
        status: body.status,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    };


    try {
        await playerRef.set(playerData, { merge: true }); // 🔹 `oculusId` ごとに管理＆部分更新

        return { statusCode: 200, body: JSON.stringify({ message: "Player data updated" }) };
    } catch (error) {
        console.error("🔥 Error updating player data:", error);
        return { statusCode: 500, body: "Database Error" };
    }
};
