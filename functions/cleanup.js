const { db } = require("./firebase");

const EXPIRATION_TIME = 10 * 60 * 1000; // 🔹 10分（600,000ミリ秒）

exports.handler = async () => {
    try {
        console.log("🧹 Running Firestore Cleanup...");

        const snapshot = await db.collection("rooms").doc("lobby").collection("players").get();
        const now = Date.now();
        let deletedCount = 0;

        const batch = db.batch(); // 🔹 バッチ処理で削除を高速化

        snapshot.forEach(doc => {
            const data = doc.data();
            const lastUpdated = data.timestamp?.toMillis?.() || 0;

            if (now - lastUpdated > EXPIRATION_TIME) {
                console.log(`🗑 Deleting player: ${data.displayName} (ID: ${doc.id})`);
                batch.delete(doc.ref);
                deletedCount++;
            }
        });

        await batch.commit(); // 🔥 まとめて削除実行
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
