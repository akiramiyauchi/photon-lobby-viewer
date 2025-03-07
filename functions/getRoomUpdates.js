const { db } = require("./firebase");

const EXPIRATION_TIME = 10 * 1000; // 10秒

exports.handler = async () => {
    try {
        const lobbyRef = db.collection("rooms").doc("lobby");
        const doc = await lobbyRef.get();

        if (!doc.exists) {
            return { statusCode: 200, body: JSON.stringify({ players: [] }) };
        }

        const data = doc.data();
        const now = Date.now();
        const activePlayers = [];

        // 期限切れのプレイヤーを除外
        Object.keys(data.players || {}).forEach(player => {
            const lastUpdated = data.players[player].timestamp?.toMillis() || 0;
            if (now - lastUpdated < EXPIRATION_TIME) {
                activePlayers.push(player);
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ players: activePlayers }),
        };
    } catch (error) {
        console.error("Error fetching room updates:", error);
        return { statusCode: 500, body: "Database Error" };
    }
};
const { db } = require("./firebase");

exports.handler = async () => {
    try {
        const snapshot = await db.collection("rooms").doc("lobby").collection("players").orderBy("timestamp", "desc").get();
        let players = [];
        snapshot.forEach(doc => players.push(doc.data()));

        return {
            statusCode: 200,
            body: JSON.stringify(players),
        };
    } catch (error) {
        return { statusCode: 500, body: "Database Error" };
    }
};
