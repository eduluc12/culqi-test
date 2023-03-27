# Lcr Game

Left, Center, Right is a dice game that may be played anywhere! It is a simple game of luck and strategy. After all, all you have to do is keep some chips. The last player that has chips, wins the game! It is simple and perfect for all ages!

## Installation

First of all we need to have **Nodejs** in our OS, you can install it using [NVM](https://github.com/nvm-sh/nvm) (recommended) or you can download it from the [official webpage](https://nodejs.org/en).

We highly recommend to use **Nodejs v16+**.

Afterwards we need to install the dependencies that this project has, for this case as our solution has **IaC and AWS Layer** in the same project, we need to install several components.

We need to execute the next command

```bash
npm i
```

In these directories:

- $project
- $project/cdk
- $project/opt/nodejs

## Testing

For executing the test suites we need to execute the next command in the project's root

```bash
npm test
```

## Building

For building we need to execute the next command in the project's root

```bash
npm build
```

## Deploy

For deploying our game, we need to have our **AWS's Credentials**, afterwards we just need to execute the next command

```bash
npm deploy
```

| :exclamation:  Important   |
|-----------------------------------------|

- The process could take several minutes
- The solution incurs in costs, this due to the services we need to consume, such as:
    - VPC endpoint
    - Redis (this could be free if you haven't overpassed the free tier)

## Steps

1) We'll create a game session, as a result we're going to have an ID (game session id)

```curl
POST /games
```

```json
{
    "numPlayers": 5,
    "diceSequence": "RL....C.L"
}
```

2) With the ID (created in the first step), we're going to resolve our game 

```curl
GET /games/{id}
```

3) Afterwards we can see the result of our game

```curl
GET /games/{id}/results
```