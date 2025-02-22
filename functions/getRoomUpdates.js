const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    // GET メソッドのみ許可
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    // /tmp/data/roomUpdates.json を読み込む
    const filePath = path.join('/tmp', 'data', 'roomUpdates.json');
    console.log("Reading data from:", filePath);

    if (!fs.existsSync(filePath)) {
        console.log("No room updates found.");
        return {
            statusCode: 200,
            body: JSON.stringify([])
        };
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        return {
            statusCode: 200,
            body: JSON.stringify(jsonData)
        };
    } catch (error) {
        console.error("Error reading room updates:", error);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};
