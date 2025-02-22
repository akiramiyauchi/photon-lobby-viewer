const fs = require('fs');
const path = require('path');

// シークレットキーを設定
const SECRET_KEY = "MySecretKey123";  // Unity スクリプトと同じ値にする

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    // デバッグ用ログを追加
    console.log("Event Body:", event.body);

    // JSON をパース
    let body;
    try {
        body = JSON.parse(event.body);
        console.log("Parsed Body:", body);  // デバッグ用
    } catch (error) {
        console.error("JSON parse error:", error);
        return {
            statusCode: 400,
            body: 'Invalid JSON'
        };
    }

    // シークレットキーの確認
    console.log("Received Secret:", body.secret); // デバッグ用
    console.log("Expected Secret:", SECRET_KEY);  // デバッグ用

    if (body.secret !== SECRET_KEY) {
        console.error("Invalid Secret Key");
        return {
            statusCode: 403,
            body: 'Forbidden'
        };
    }

    const data = {
        status: body.status,
        player: body.player,
        timestamp: new Date().toISOString()
    };

    // 修正: データ保存ディレクトリのパスを修正
    const dataDir = path.resolve(__dirname, '../../public/data');
    const filePath = path.join(dataDir, 'roomUpdates.json');

    // 修正: ディレクトリが存在しない場合は作成
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // JSON を保存
    let currentData = [];
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath);
        currentData = JSON.parse(fileContent);
    }
    currentData.push(data);
    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Room update received" })
    };
};
