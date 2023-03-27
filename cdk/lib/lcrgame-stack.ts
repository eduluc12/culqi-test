import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as target from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { resolve } from 'path';
import { EventField, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import { SqsEventSource, DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { ManagedPolicy, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as elasticcache from 'aws-cdk-lib/aws-elasticache';

export class LcrGameStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pathToSource = resolve(__dirname, '../../');

    const lcrGameVpc = new ec2.Vpc(this, `LcrGameVpc`, {
      maxAzs: 2,
      cidr: "10.100.150.0/24",
      subnetConfiguration: [
        {
          name: `LcrGameVpcPublicSubnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: `LcrGameVpcPrivateSubnet1`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          name: `LcrGameVpcPrivateSubnet2`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const lcrGameVpcLambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LcrGameVpcSecurityGroup`,
      {
        vpc: lcrGameVpc,
        allowAllOutbound: true
      }
    );

    lcrGameVpcLambdaSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTcp())

    lcrGameVpc.addInterfaceEndpoint('lcrGameVpcInterfaceLambda', {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      privateDnsEnabled: true,
      securityGroups: [lcrGameVpcLambdaSecurityGroup],
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      }
    })

    lcrGameVpc.addInterfaceEndpoint('lcrGameVpcInterfaceEvents', {
      service: ec2.InterfaceVpcEndpointAwsService.EVENTBRIDGE,
      privateDnsEnabled: true,
      securityGroups: [lcrGameVpcLambdaSecurityGroup],
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      }
    })

    lcrGameVpc.addGatewayEndpoint('lcrGameVpcGatewayDynamodb', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]
    })

    const lcrGameVpcRedisSecurityGroup = new ec2.SecurityGroup(
      this,
      `LcrGameVpcRedisSecurityGroup`,
      {
        vpc: lcrGameVpc,
        allowAllOutbound: true
      }
    );

    lcrGameVpcRedisSecurityGroup.addIngressRule(ec2.Peer.securityGroupId(lcrGameVpcLambdaSecurityGroup.securityGroupId), ec2.Port.allTcp())

    const lcrGameRedisClusterSubnetGroup = new elasticcache.CfnSubnetGroup(this, `LcrGameRedisClusterSubnetGroup`, {
        description: "redis cluster subnet",
        subnetIds: lcrGameVpc.isolatedSubnets.map((item) => item.subnetId),
      }
    );

    const lcrGameRedisCluster = new elasticcache.CfnCacheCluster(this, 'LcrGameRedisCluster', {
      engine: 'redis',
      cacheNodeType: 'cache.t2.micro',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [
        lcrGameVpcRedisSecurityGroup.securityGroupId
      ],
      cacheSubnetGroupName: lcrGameRedisClusterSubnetGroup.ref,
    });

    const lcrGameApi = new apigateway.RestApi(this, 'LcrGameApi', {
      restApiName: 'lcrGameApi',
    });

    const lcrGameDatabase = new dynamodb.Table(this, 'LcrGameDatabase', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: 'LcrGame',
      partitionKey: {
        name: 'gameId',
        type: dynamodb.AttributeType.STRING
      },
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const lcrGameDatabaseSync = new dynamodb.Table(this, 'LcrGameDatabaseSync', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: 'LcrGameSync',
      partitionKey: {
        name: 'gameId',
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const lcrGameSqs = new sqs.Queue(this, 'LcrGameSqs', {
      queueName: 'lcrGameSqs',
      visibilityTimeout: cdk.Duration.seconds(30 * 6),
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const lcrGameRuleEventBridge = new events.Rule(this, 'LcrGameRuleEventBridge', {
      eventPattern: {
        source: ["lcrgame.result"],
      },
    });

    lcrGameRuleEventBridge.addTarget(new target.SqsQueue(lcrGameSqs, {
      retryAttempts: 3,
      message: RuleTargetInput.fromObject({
        result: EventField.fromPath('$.detail')
      })
    }))

    const lcrGameLayer = new lambda.LayerVersion(this, 'LcrGameLayer', {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_16_X
      ],
      code: lambda.Code.fromAsset(`${pathToSource}/opt`)
    });

    const lambdaLcrGameProcess = new lambda.Function(this, 'LambdaLcrGameProcess', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'algorithm.handler',
      code: lambda.Code.fromAsset(`${pathToSource}/dist`),
      timeout: cdk.Duration.seconds(30),
      role: new iam.Role(this, 'LambdaLcrGameProcessRule', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'LambdaLcrGameProcessIamRole',
        managedPolicies: [
          ManagedPolicy.fromManagedPolicyArn(this, 'LambdaLcrGameProcessAWSLambdaBasicExecutionRole', 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
        ]
      }),
      layers: [lcrGameLayer]
    });

    const lambdaLcrGameSave = new lambda.Function(this, 'LambdaLcrGameSave', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'save.handler',
      code: lambda.Code.fromAsset(`${pathToSource}/dist`),
      environment: {
        DYNAMODB_TABLE: lcrGameDatabase.tableName
      },
      timeout: cdk.Duration.seconds(30),
      role: new iam.Role(this, 'LambdaLcrGameSaveRule', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'LambdaLcrGameSaveRuleIamRule',
        managedPolicies: [
          ManagedPolicy.fromManagedPolicyArn(this, 'LambdaLcrGameSaveAWSLambdaBasicExecutionRole', 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
        ],
        inlinePolicies: {
          root: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: ['*'],
                actions: [
                  'dynamodb:*'
                ]
              })
            ]
          })
        }
      }),
      layers: [lcrGameLayer]
    });

    lambdaLcrGameSave.addEventSource(new SqsEventSource(lcrGameSqs))

    const lambdaLcrGameTransform = new lambda.Function(this, 'LambdaLcrGameTransform', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'transform.handler',
      code: lambda.Code.fromAsset(`${pathToSource}/dist`),
      environment: {
        DYNAMODB_TABLE: lcrGameDatabaseSync.tableName
      },
      timeout: cdk.Duration.seconds(30),
      role: new iam.Role(this, 'LambdaLcrGameTransformIamRule', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'lambdaLcrGameTransformIamRule',
        managedPolicies: [
          ManagedPolicy.fromManagedPolicyArn(this, 'LambdaLcrGameTransformAWSLambdaBasicExecutionRole', 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
        ],
        inlinePolicies: {
          root: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: ['*'],
                actions: [
                  'dynamodb:*'
                ]
              })
            ]
          })
        }
      }),
      layers: [lcrGameLayer]
    });

    lambdaLcrGameTransform.addEventSource(new DynamoEventSource(lcrGameDatabase, {
      startingPosition: lambda.StartingPosition.LATEST
    }))

    const lambdaLcrGameCrud = new lambda.Function(this, 'LambdaLcrGameCrud', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'crud.handler',
      code: lambda.Code.fromAsset(`${pathToSource}/dist`),
      environment: {
        REDIS_ENDPOINT: lcrGameRedisCluster.attrRedisEndpointAddress,
        REDIS_PORT: lcrGameRedisCluster.attrRedisEndpointPort,
        LAMBDA_PROCESS: lambdaLcrGameProcess.functionArn,
        DYNAMODB_TABLE: lcrGameDatabaseSync.tableName
      },
      timeout: cdk.Duration.seconds(30),
      securityGroups: [
        lcrGameVpcLambdaSecurityGroup
      ],
      vpc: lcrGameVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      role: new iam.Role(this, 'LambdaLcrGameCrudIamRule', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        roleName: 'lambdaLcrGameCrudIamRule',
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
          ManagedPolicy.fromManagedPolicyArn(this, 'LambdaLcrGameCrudAWSLambdaBasicExecutionRole', 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
        ],
        inlinePolicies: {
          root: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [lambdaLcrGameProcess.functionArn],
                actions: [
                  'lambda:*'
                ]
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: ['*'],
                actions: [
                  'events:*'
                ]
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: ['*'],
                actions: [
                  'dynamodb:*'
                ]
              })
            ]
          })
        }
      }),
      layers: [lcrGameLayer]
    });

    lcrGameApi.root.addMethod('ANY', new apigateway.LambdaIntegration(lambdaLcrGameCrud))

    const lcrGameApiGamesResource = lcrGameApi.root.addResource('{proxy+}');
    lcrGameApiGamesResource.addMethod('ANY', new apigateway.LambdaIntegration(lambdaLcrGameCrud))

  }
}
