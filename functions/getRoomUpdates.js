const { db } = require("./firebase");
const admin = require("firebase-admin");

const EXPIRATION_TIME = 10 * 1000; // 🔹 10秒以内のデータのみ取得
const CACHE_DURATION = 10 * 1000; // 🔥 10秒間キャッシュ

let cachedData = null;
let lastFetchTime = 0;

exports.handler = async () => {
    try {
        const now = Date.now();

        // 🔥 キャッシュが有効なら、Firestore にアクセスせずそのまま返す
        if (cachedData && now - lastFetchTime < CACHE_DURATION) {
            console.log("🟢 Returning cached data...");
            return {
                statusCode: 200,
                body: JSON.stringify({ players: cachedData }),
            };
        }

        console.log("📌 Fetching fresh data from Firestore...");

        const snapshot = await db.collection("rooms")
            .doc("lobby")
            .collection("players")
            .where("timestamp", ">", admin.firestore.Timestamp.fromMillis(now - EXPIRATION_TIME))
            .get();

        const activePlayers = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            activePlayers[data.oculusId] = {
                displayName: data.displayName,
                status: data.status,
                level: typeof data.level === "number" ? data.level : "N/A",
            };
        });

        console.log(`✅ Found ${Object.keys(activePlayers).length} active players.`);

        // 🔥 キャッシュを更新
        cachedData = activePlayers;
        lastFetchTime = now;

        return {
            statusCode: 200,
            body: JSON.stringify({ players: activePlayers }),
        };
    } catch (error) {
        console.error("🔥 Error fetching room updates:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Database Error", details: error.message }) };
    }
};
