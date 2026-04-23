import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

function generateShortUrl() {
  return Math.random().toString(36).substring(2, 8).toLowerCase();
}

export const shortenUrl = async (event) => {
  const { url } = JSON.parse(event.body);

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "URL is required" }),
    };
  }

  const shortUrl = generateShortUrl();

  const item = {
    id: shortUrl,
    originalUrl: url,
    createdAt: Date.now(),
    expiresAt: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days TTL
    clicks: 0,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: "url-shortener",
        Item: item,
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        shortUrl,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Could not create short URL" }),
    };
  }
};
