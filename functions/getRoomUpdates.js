const { db } = require("./firebase");

//const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 🔹 1日（86,400,000ミリ秒）
const EXPIRATION_TIME =  60 * 1000; // 🔹 60秒

exports.handler = async () => {
    try {
        const snapshot = await db.collection("rooms").doc("lobby").collection("players").get();
        const now = Date.now();
        const activePlayers = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log("📌 Firestore Raw Data:", JSON.stringify(data)); // 🔹 Firestore のデータをログ出力

            // `timestamp` の型をチェック
            console.log("🕒 Timestamp Type:", typeof data.timestamp, "| Value:", data.timestamp);

            const lastUpdated = data.timestamp?.toMillis?.() || 0;
            console.log("📅 Converted Timestamp:", lastUpdated, "| Now:", now);

            if (now - lastUpdated < EXPIRATION_TIME) {
                activePlayers[data.oculusId] = {
                    displayName: data.displayName,
                    status: data.status,
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
