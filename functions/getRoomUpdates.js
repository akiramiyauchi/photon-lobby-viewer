const { db } = require("./firebase");

const EXPIRATION_TIME = 60 * 1000; // 60秒

exports.handler = async () => {
    try {
        const snapshot = await db.collection("rooms").doc("lobby").collection("players").get();
        const now = Date.now();
        const activePlayers = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Firestore の `serverTimestamp()` 直後の `null` 対策
            const lastUpdated = data.timestamp?.toMillis?.() || 0;
            
            if (now - lastUpdated < EXPIRATION_TIME) {
                activePlayers[data.oculusId] = {
                    displayName: data.displayName,
                    status: data.status,
                    timestamp: lastUpdated
                };
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ players: activePlayers }), // 🔹 `players` をオブジェクトとして返す
        };
    } catch (error) {
        console.error("🔥 Error fetching room updates:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Database Error", details: error.message }) };
    }
};
