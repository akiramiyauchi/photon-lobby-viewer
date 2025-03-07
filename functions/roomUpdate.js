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

    const data = {
        status: body.status,
        player: body.player,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),  // Firestore の Timestamp を自動生成
    };

    try {
        await db.collection("rooms").doc("lobby").collection("players").add(data);
        return { statusCode: 200, body: JSON.stringify({ message: "Room update saved" }) };
    } catch (error) {
        return { statusCode: 500, body: "Database Error" };
    }
};
