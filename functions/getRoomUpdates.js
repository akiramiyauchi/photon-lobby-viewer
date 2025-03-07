const { db } = require("./firebase"); // dbを再定義しない！

const EXPIRATION_TIME = 10 * 1000; // 10秒

exports.handler = async () => {
    try {
        const lobbyRef = db.collection("rooms").doc("lobby");
        const doc = await lobbyRef.get();

        if (!doc.exists) {
            console.error("Firestore: lobby document does not exist.");
            return { statusCode: 200, body: JSON.stringify({ players: [] }) };
        }

        const data = doc.data();
        if (!data || !data.players) {
            console.error("Firestore: lobby document has no players field.");
            return { statusCode: 200, body: JSON.stringify({ players: [] }) };
        }

        const now = Date.now();
        const activePlayers = [];

        Object.keys(data.players).forEach(player => {
            const lastUpdated = data.players[player].timestamp?.toMillis() || 0;
            if (now - lastUpdated < EXPIRATION_TIME) {
                activePlayers.push(player);
            }
        });

        console.log(`Active players: ${JSON.stringify(activePlayers)}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ players: activePlayers }),
        };
    } catch (error) {
        console.error("Error fetching room updates:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Database Error", details: error.message }) };
    }
};
