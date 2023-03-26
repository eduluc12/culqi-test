import { SQSEvent, Handler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

export const handler : Handler = async (event : SQSEvent) => {
    const client = new DynamoDBClient({});
    const records = event.Records.map(({body}) => {
        const {
            gameId,
            result
        } = JSON.parse(body);
        return client.send(new PutItemCommand({
            TableName: process.env.DYNAMO_TABLE,
            Item: marshall({
                gameId,
                result: JSON.stringify(result)
            })
        }))
    });
    await Promise.all(records);
}