const { db } = require("./firebase");
const admin = require("firebase-admin");

const SECRET_KEY = "MySecretKey123";
const EXPIRATION_TIME = 10 * 1000; // 10秒

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

    const now = admin.firestore.Timestamp.now(); // 🔹 Firestore の `Timestamp` を使用
    const playersData = {};

    body.players.forEach(player => {
        playersData[player] = {
            player: player,
            status: "Joined",
            timestamp: now // 🔹 `timestamp` を Firestore の `Timestamp` にする
        };
    });

    try {
        const lobbyRef = db.collection("rooms").doc("lobby");

        await lobbyRef.set({ players: playersData }, { merge: true });

        return { statusCode: 200, body: JSON.stringify({ message: "Lobby update saved" }) };
    } catch (error) {
        console.error("🔥 Error updating lobby:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Database Error", details: error.message }) };
    }
};
