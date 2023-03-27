import { DynamoDBStreamEvent, Handler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

type TransformInput = {
    gameId: string,
    result: string
}

export const handler : Handler = async (event : DynamoDBStreamEvent) => {
    const client = new DynamoDBClient({});
    const records = event.Records.map((item) => {
        const {
            dynamodb
        } = item;
        const {
            gameId,
            result
        } = unmarshall(dynamodb?.NewImage as Record<string, AttributeValue>) as TransformInput
        const data = JSON.parse(result);
        const formatting = format(data);
        return client.send(new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: marshall({
                gameId,
                result: formatting
            })
        }))
    });
    await Promise.all(records);
}

const format = (history : any[]) => {
    const getAllHistory = history;
    return getAllHistory.map(({ player, chips, placeChip, winner, nextRoll }) => {
        if (placeChip === 'P') {
            let output = `Player ${player}: ${chips}`;
            output += winner ? '(W)' : '';
            output += nextRoll ? '(*)' : '';
            return output;
        }
        return `Center: ${chips}`;
    }).join(' | ');
}