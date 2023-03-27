import { LcrGameConsumer } from "../../../../src/lcr/process/algorithm/consumer";

describe('LcrGameConsumer', () => {

    test("Should save the sequence input", () => {
        const lcrGameConsumer = new LcrGameConsumer();
        const sequence = "LCR.";

        lcrGameConsumer.entry(sequence);

        expect(lcrGameConsumer['diceSequence']).toBe(sequence);
    });

    test("Should throw an error when we pass an invalid symbol", () => {
        const lcrGameConsumer = new LcrGameConsumer();
        const sequence = "XCR.";
        lcrGameConsumer.entry(sequence);

        expect(() => lcrGameConsumer.consume()).toThrowError("The symbol X is invalid");
    });

    test("Should count the number of symbol that we did not consume", () => {
        const lcrGameConsumer = new LcrGameConsumer();
        const sequence = "LCR.";
        lcrGameConsumer.entry(sequence);
        lcrGameConsumer.consume();
        lcrGameConsumer.consume();

        const leftToConsume = lcrGameConsumer.leftToConsume();

        expect(leftToConsume).toBe(2);
    });

    test("Should finish the consumer when we have consumed the all sequence", () => {
        const lcrGameConsumer = new LcrGameConsumer();
        const sequence = "LCR.";
        lcrGameConsumer.entry(sequence);
        lcrGameConsumer.consume();
        lcrGameConsumer.consume();
        lcrGameConsumer.consume();

        const isFinished = lcrGameConsumer.isFinished();

        expect(isFinished).toBe(true);
    });
});
