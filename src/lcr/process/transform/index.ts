import { DynamoDBStreamEvent, Handler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import {EOL} from 'os';

type TransformInput = {
    gameId: string,
    results: string
}

export const handler : Handler = async (event : DynamoDBStreamEvent) => {
    const client = new DynamoDBClient({});
    const records = event.Records.map((item) => {
        const {
            dynamodb
        } = item;
        const {
            gameId,
            results
        } = dynamodb?.NewImage as TransformInput
        const data = JSON.parse(results);
        const formatting = format(data);
        return client.send(new PutItemCommand({
            TableName: process.env.DYNAMO_TABLE,
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
    }).join(EOL);
}