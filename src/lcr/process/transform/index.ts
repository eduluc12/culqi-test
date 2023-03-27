import { DynamoDBStreamEvent, Handler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { format } from './format';
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
