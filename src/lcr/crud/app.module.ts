import { Module, Inject } from "@nestjs/common";
import { createClient } from '@redis/client';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LcrGameController } from "./controller";

@Module({
    controllers: [LcrGameController],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async () => {
                const client = createClient({
                    url: `redis://${process.env.REDIS_ENDPOINT}:${process.env.REDIS_PORT}`,
                });
                client.on('ready', () => console.log('Ready for connecting on redis'));
                client.on('error', err => console.log('Redis Client Error', err));
                await client.connect();
                return client;
            }
        },
        {
            provide: 'AWS_LAMBDA',
            useValue: new LambdaClient({})
        },
        {
            provide: 'AWS_EVENTBRIDGE',
            useValue: new EventBridgeClient({})
        },
        {
            provide: 'AWS_DYNAMODB',
            useValue: new DynamoDBClient({})
        }
    ]
})
export class AppModule{

    constructor(@Inject('REDIS_CLIENT') private redis : ReturnType<typeof createClient>) {}

    async onModuleDestroy() {
        await this.redis.disconnect();
    } 

}