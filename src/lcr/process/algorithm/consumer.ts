import { Consumer } from "./interfaces/consumer";

export type LcrGameSymbol = 'L' | 'C' | 'R' | '.';

export class LcrGameConsumer implements Consumer<LcrGameSymbol>{

    private diceSequenceStep = 0;
    private diceValidSymbols : LcrGameSymbol[] = ['L', 'C', 'R', '.'];
    private diceSequence = '';

    entry(sequence: string): void {
        this.diceSequence = sequence;
    }

    consume() {
        const symbol = this.diceSequence[this.diceSequenceStep++] as LcrGameSymbol;
        const isValidSymbol = this.diceValidSymbols.includes(symbol);
        if(!isValidSymbol) throw new Error(`The symbol ${symbol} is invalid`);
        return symbol;
    }

    leftToConsume(): number {
        return this.diceSequence.length - this.diceSequenceStep;
    }

    isFinished(): boolean {
        return this.diceSequenceStep >= this.diceSequence.length - 1
    }

}