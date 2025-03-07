const { db } = require("./firebase");
const admin = require("firebase-admin");

const SECRET_KEY = "MySecretKey123";
const EXPIRATION_TIME = 10 * 1000; // 10秒（古すぎるプレイヤーを削除）

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return { statusCode: 400, body: "Invalid JSON" };
    }

    if (body.secret !== SECRET_KEY) {
        return { statusCode: 403, body: "Forbidden" };
    }

    const now = Date.now(); // 現在の時刻（ミリ秒）
    const playersData = {};

    body.players.forEach(player => {
        playersData[player] = {
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
    });

    try {
        const lobbyRef = db.collection("rooms").doc("lobby");

        await db.runTransaction(async (transaction) => {
            const lobbyDoc = await transaction.get(lobbyRef);

            if (lobbyDoc.exists) {
                const existingPlayers = lobbyDoc.data().players || {};
                const updatedPlayers = {};

                // プレイヤーの更新 & 古いプレイヤーの削除
                Object.keys(existingPlayers).forEach(player => {
                    if (playersData[player]) {
                        updatedPlayers[player] = playersData[player]; // アクティブなプレイヤーを更新
                    } else {
                        const lastUpdated = existingPlayers[player].timestamp?.toMillis() || 0;
                        if (now - lastUpdated < EXPIRATION_TIME) {
                            updatedPlayers[player] = existingPlayers[player]; // 期限内のプレイヤーは維持
                        }
                    }
                });

                // 新しいプレイヤーを追加
                Object.keys(playersData).forEach(player => {
                    updatedPlayers[player] = playersData[player];
                });

                transaction.set(lobbyRef, { players: updatedPlayers, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
            } else {
                transaction.set(lobbyRef, { players: playersData, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
            }
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Lobby update saved" }) };
    } catch (error) {
        console.error("Error updating lobby:", error);
        return { statusCode: 500, body: "Database Error" };
    }
};
