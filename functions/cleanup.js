const { db } = require("./firebase");
const { schedule } = require("@netlify/functions");

const EXPIRATION_TIME = 10 * 60 * 1000; // 10分（600,000ミリ秒）

const handler = async () => {
    try {
        console.log("🧹 Running Firestore Cleanup...");

        const snapshot = await db.collection("rooms").doc("lobby").collection("players").get();
        const now = Date.now();
        let deletedCount = 0;

        console.log(`📌 Current Time: ${new Date(now).toISOString()}`);

        const batch = db.batch();

        snapshot.forEach(doc => {
            const data = doc.data();
            const lastUpdated = data.timestamp?.toMillis?.() || 0;

            console.log(`🔎 Checking player: ${data.displayName} (ID: ${doc.id}), Last Updated: ${new Date(lastUpdated).toISOString()}`);

            if (now - lastUpdated > EXPIRATION_TIME) {
                console.log(`🗑 Deleting player: ${data.displayName} (ID: ${doc.id})`);
                batch.delete(doc.ref);
                deletedCount++;
            }
        });

        await batch.commit();
        console.log(`✅ Cleanup completed. Deleted ${deletedCount} old players.`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Deleted ${deletedCount} old players.` }),
        };
    } catch (error) {
        console.error("🔥 Error in Firestore Cleanup:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Cleanup failed", details: error.message }) };
    }
};

// ✅ Netlify のスケジュール関数を `module.exports` で登録
module.exports = schedule("every 10 minutes", handler);
