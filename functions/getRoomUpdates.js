const { db } = require("./firebase");

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
        console.log("🔥 Firestore Raw Data:", JSON.stringify(data)); // 🔹 Firestore の取得データを出力

        if (!data || !data.players) {
            console.error("🚨 Firestore: lobby document has no players field.");
            return { statusCode: 200, body: JSON.stringify({ players: [] }) };
        }

        console.log("✅ Firestore has players field:", JSON.stringify(data.players));

        const now = Date.now();
        const activePlayers = [];

        Object.keys(data.players).forEach(player => {
            const playerData = data.players[player];
            console.log(`🔍 Checking player: ${player}, Data: ${JSON.stringify(playerData)}`);

            // 🔹 `timestamp` が正しく取得できているかチェック
            const lastUpdated = playerData.timestamp?.toMillis?.() || 0;
            console.log(`📅 Timestamp: ${lastUpdated}, Now: ${now}`);

            if (now - lastUpdated < EXPIRATION_TIME) {
                activePlayers.push({
                    player: playerData.player || player, // 🔹 `player` フィールドがあれば使う
                    status: playerData.status || "Unknown", // 🔹 `status` がない場合は "Unknown"
                    timestamp: lastUpdated
                });
            }
        });

        console.log(`✅ Active players after filtering: ${JSON.stringify(activePlayers)}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ players: activePlayers }),
        };
    } catch (error) {
        console.error("🔥 Error fetching room updates:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Database Error", details: error.message }) };
    }
};
