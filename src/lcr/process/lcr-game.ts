import { EOL } from 'os';
import type { Consumer, History, Format } from './interfaces';
import type { LcrGameSymbol } from './consumer';
import { SimpleHistory } from './history';

export enum LcrGamePlaceChip {
    PLAYER = 'P',
    CENTER = 'C'
}

export type LcrGameHistory = {
    player?: number,
    chips: number,
    winner: boolean,
    nextRoll: boolean,
    placeChip: LcrGamePlaceChip
}

export class LcrGame implements Format {

    private numPlayers: number = 0;
    private chipsTable: [Map<number, number>, number] = [new Map(), 0];
    private playerTurn = 1;
    private historyPerRound: History<LcrGameHistory> = new SimpleHistory();

    constructor(
        private consumer: Consumer<LcrGameSymbol>,
        private history: History<LcrGameHistory>
    ) { }

    setSettings(numPlayers: number, diceSequence: string) {
        if (numPlayers < 3) throw new Error('The number of players should be greater than 3');
        this.numPlayers = numPlayers;
        this.consumer.entry(diceSequence);
        const [players] = this.chipsTable;
        for (let i = 1; i <= numPlayers; i++) {
            players.set(i, 3);
        }
    }

    play() {
        const [players] = this.chipsTable;
        const numberOfChipsPerPlayer = players.get(this.playerTurn);
        const numberOfDicesToPlay = numberOfChipsPerPlayer! >= 3 ? 3 : numberOfChipsPerPlayer;
        const leftToConsume = this.consumer.leftToConsume();
        let playerNextPlay: number;
        if (leftToConsume >= numberOfDicesToPlay!) {
            for (let i = 1; i <= numberOfDicesToPlay!; i++) this.playDice();
            const { playerFromLeft } = this.defineNextPlayer();
            playerNextPlay = playerFromLeft;
        } else {
            for (let i = 1; i <= leftToConsume!; i++) this.consumer.consume();
            playerNextPlay = this.playerTurn;
        }
        this.playerTurn = playerNextPlay!;
    }

    isGameOver() {
        const [players, center] = this.chipsTable;
        const playersInArray = Array.from(players.entries());
        const isOverflowStep = this.consumer.isFinished();
        let gameOver = false;
        if (isOverflowStep) {
            const playerToNextPlay = this.playerTurn
            playersInArray.forEach(([player, chips]) => {
                this.historyPerRound.save({
                    player,
                    chips,
                    winner: false,
                    nextRoll: player === playerToNextPlay,
                    placeChip: LcrGamePlaceChip.PLAYER
                });
            })
            gameOver = true;
        } else {
            const playersWithNoDices = playersInArray.filter(([, dices]) => dices === 0);
            if (playersWithNoDices.length === this.numPlayers - 1) {
                playersInArray.forEach(([player, chips]) => {
                    this.historyPerRound.save({
                        player,
                        chips,
                        winner: chips !== 0,
                        nextRoll: false,
                        placeChip: LcrGamePlaceChip.PLAYER
                    });
                })
                gameOver = true;
            }
        }

        if (gameOver) {
            this.history.append(this.historyPerRound);
            this.history.save({
                chips: center,
                nextRoll: false,
                placeChip: LcrGamePlaceChip.CENTER,
                winner: false
            });
            this.historyPerRound.clear();
        }

        return gameOver;
    }

    format() {
        const getAllHistory = this.historyPerRound.getAll();
        return getAllHistory.map(({ player, chips, placeChip, winner, nextRoll }) => {
            if (placeChip === LcrGamePlaceChip.PLAYER) {
                let output = `Player ${player}: ${chips}`;
                output += winner ? '(W)' : '';
                output += nextRoll ? '(*)' : '';
                return output;
            }
            return `Center: ${chips}`;
        }).join(EOL);
    }

    private playDice() {
        const player = this.playerTurn;
        let [players] = this.chipsTable;
        const dice = this.consumer.consume();
        const {
            playerFromLeft,
            playerFromRight
        } = this.defineNextPlayer();
        let subtractDiceFromPlayer = true;
        switch (dice) {
            case 'R':
                players.set(playerFromRight, players.get(playerFromRight)! + 1);
                break;
            case 'L':
                players.set(playerFromLeft, players.get(playerFromLeft)! + 1);
                break;
            case 'C':
                this.chipsTable[1]++;
                break;
            case '.':
                subtractDiceFromPlayer = false;
                break;
        }
        if (subtractDiceFromPlayer) players.set(player, players.get(player)! - 1);
    }

    private defineNextPlayer() {
        const player = this.playerTurn;
        return {
            playerFromLeft: player === this.numPlayers ? 1 : player + 1,
            playerFromRight: player === 1 ? this.numPlayers : player - 1
        }
    }

}