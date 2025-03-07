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
