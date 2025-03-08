const { db } = require("./firebase");

const EXPIRATION_TIME = 60 * 1000; // 60秒（テスト用）

exports.handler = async () => {
    try {
        const snapshot = await db.collection("rooms").doc("lobby").collection("players").get();
        const now = Date.now();
        const activePlayers = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log("📌 Firestore Raw Data:", JSON.stringify(data));

            const lastUpdated = data.timestamp?.toMillis?.() || 0;
            console.log("📅 Converted Timestamp:", lastUpdated, "| Now:", now);

            if (now - lastUpdated < EXPIRATION_TIME) {
                activePlayers[data.oculusId] = {
                    displayName: data.displayName,
                    status: data.status,
                    level: typeof data.level === "number" ? data.level : "N/A", // 🔹 `level` を取得
                    timestamp: lastUpdated
                };
            }
        });

        console.log("✅ Active Players:", JSON.stringify(activePlayers));

        return {
            statusCode: 200,
            body: JSON.stringify({ players: activePlayers }),
        };
    } catch (error) {
        console.error("🔥 Error fetching room updates:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Database Error", details: error.message }) };
    }
};
