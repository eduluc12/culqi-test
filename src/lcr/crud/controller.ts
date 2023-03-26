import { Controller, Get, Post, Body, Inject, Param } from '@nestjs/common';
import { createClient } from '@redis/client';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { LcrGameCreateInput } from './dto/create';
import { nanoid } from 'nanoid';
@Controller('games')
export class LcrGameController{

    constructor(
        @Inject('REDIS_CLIENT') private redis : ReturnType<typeof createClient>,
        @Inject('AWS_LAMBDA') private lambda : LambdaClient,
        @Inject('AWS_EVENTBRIDGE') private eventbridge : EventBridgeClient,
        @Inject('AWS_DYNAMODB') private dynamodb : DynamoDBClient
    ){}

    @Post()
    async create(@Body() payload : LcrGameCreateInput){
        const {
            diceSequence,
            numPlayers
        } = payload;
        const gameId = nanoid();
        await this.redis.set(gameId, JSON.stringify({numPlayers, diceSequence}))
        return {
            status: 'ok',
            data: {
                gameId
            }
        }
    }

    @Get(':gameId')
    async process(@Param('gameId') gameId : string){
        const gameData = await this.redis.get(gameId);
        if(!gameData) throw new Error();
        const result = await this.lambda.send(new InvokeCommand({
            FunctionName: process.env.LAMBDA_PROCESS,
            Payload: Buffer.from(gameData)
        }));
        const response = Buffer.from(result.Payload!).toString('utf8');
        const gameResult = JSON.parse(response);
        await this.eventbridge.send(new PutEventsCommand({
            Entries: [{
                Source: 'lcrgame',
                Detail: JSON.stringify({
                    gameId,
                    result: gameResult
                })
            }],
        }));
        return {
            status: 'ok',
            data: 'The game was successfully executed, please check out the result'
        }
    }

    @Get(':gameId/results')
    async results(@Param('gameId') gameId : string){
        const data = await this.dynamodb.send(new GetItemCommand({
            TableName: process.env.DYNAMO_TABLE,
            Key: marshall({
                gameId
            })
        }))
        const result = unmarshall(data.Item!);
        return {
            status: 'ok',
            data: result.result
        }
    }

}