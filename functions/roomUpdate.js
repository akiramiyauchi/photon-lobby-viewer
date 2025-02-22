const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    const body = JSON.parse(event.body);
    const data = {
        status: body.status,
        player: body.player,
        timestamp: new Date().toISOString()
    };

    const filePath = path.join(__dirname, '../public/data/roomUpdates.json');

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
