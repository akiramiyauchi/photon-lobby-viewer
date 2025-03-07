const { db } = require("./firebase");

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
        timestamp: new Date().toISOString(),
    };

    try {
        await db.collection("rooms").doc("lobby").collection("players").add(data);
        return { statusCode: 200, body: JSON.stringify({ message: "Room update saved" }) };
    } catch (error) {
        return { statusCode: 500, body: "Database Error" };
    }
};
