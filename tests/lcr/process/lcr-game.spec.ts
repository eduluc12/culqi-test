import { LcrGameConsumer, LcrGameSymbol } from "../../../src/lcr/process/consumer";
import { SimpleHistory } from "../../../src/lcr/process/history";
import type { Consumer, History } from "../../../src/lcr/process/interfaces";
import { LcrGame, LcrGameHistory } from "../../../src/lcr/process/lcr-game";

describe('Lcr Game', () => {

    let consumer : Consumer<LcrGameSymbol>;
    let history : History<LcrGameHistory>;
    let lcrGame : LcrGame;

    beforeEach(() => {
        consumer = new LcrGameConsumer();
        history = new SimpleHistory<LcrGameHistory>();
        lcrGame = new LcrGame(
            consumer,
            history
        );
    })

    afterEach(() => {
        jest.restoreAllMocks();
    })

    test('Should throw an exception if number of players are below than 3', () => {
        expect(() => {
            lcrGame.setSettings(2, 'LRR')
        }).toThrowError('The number of players should be greater than 3')
    })

    test('Should throw an exception if the sequence has differents values allowed', () => {
        lcrGame.setSettings(3, 'XXX')
        expect(() => {
            lcrGame.play();
        }).toThrowError('The symbol X is invalid');
    })

    test('Should keep zero dices when the sequence does not have "."', () => {
        lcrGame.setSettings(3, 'LLL')
        lcrGame.isGameOver();
        lcrGame.play();
        lcrGame.isGameOver();
        const historyAll = history.getAll();
        expect(historyAll[0]).toMatchObject({
            chips: 0
        })
    })

    test('Should keep one dice when the sequence have a only "."', () => {
        lcrGame.setSettings(3, 'LR.')
        lcrGame.isGameOver();
        lcrGame.play();
        lcrGame.isGameOver();
        const historyAll = history.getAll();
        expect(historyAll[0]).toMatchObject({
            chips: 1
        })
        expect(historyAll[1]).toMatchObject({
            chips: 4
        })
        expect(historyAll[2]).toMatchObject({
            chips: 4
        })
    })

    test('Should send the whole dices to "center" when the whole sequence is "C"', () => {
        lcrGame.setSettings(3, 'CCC')
        lcrGame.isGameOver();
        lcrGame.play();
        lcrGame.isGameOver();
        const historyAll = history.getAll();
        expect(historyAll[0]).toMatchObject({
            chips: 0
        })
        expect(historyAll[3]).toMatchObject({
            chips: 3
        })
    })

    test('Should put the state nextRoll to the second player when the second player did not play', () => {
        lcrGame.setSettings(3, 'CCC')
        lcrGame.isGameOver();
        lcrGame.play();
        lcrGame.isGameOver();
        const historyAll = history.getAll();
        expect(historyAll[1]).toMatchObject({
            nextRoll: true
        })
    })

    test('Should put the state winner to the third player when he has the whole dices', () => {
        lcrGame.setSettings(3, 'LR.CCR.L.RLLLCLR.LL..R...CLR.')
        while(!lcrGame.isGameOver()){
            lcrGame.play();
        }
        const historyAll = history.getAll();
        expect(historyAll).toMatchObject([
            {
                player: 1,
                chips: 0
            },
            {
                player: 2,
                chips: 0
            },
            {
                player: 3,
                chips: 6,
                winner: true
            },
            {
                chips: 3,
            }
        ])
    })

    test('Should put the state nextRoll to the third player when he has the whole dices', () => {
        lcrGame.setSettings(5, 'RL....C.L')
        while(!lcrGame.isGameOver()){
            lcrGame.play();
        }
        const historyAll = history.getAll();
        expect(historyAll).toMatchObject([
            {
                player: 1,
                chips: 1
            },
            {
                player: 2,
                chips: 4
            },
            {
                player: 3,
                chips: 1,
            },
            {
                player: 4,
                chips: 4,
                nextToRoll: true
            },
            {
                player: 5,
                chips: 4,
            },
            {
                chips: 1
            }
        ])
    })

})