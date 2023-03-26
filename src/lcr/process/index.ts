import { LcrGameConsumer } from "./consumer";
import { SimpleHistory } from "./history";
import { LcrGame, LcrGameHistory } from "./lcr-game";

type GameInput = {
    numPlayers: number,
    diceSequence: string
}

export const handler = (event : any) => {
    const {
        numPlayers,
        diceSequence
    } = JSON.parse(event) as GameInput;
    const consumer = new LcrGameConsumer();
    const history = new SimpleHistory<LcrGameHistory>();
    const lcrGame = new LcrGame(consumer, history);
    lcrGame.setSettings(numPlayers, diceSequence);
    while(!lcrGame.isGameOver()) lcrGame.play();
    return history.getAll();
}