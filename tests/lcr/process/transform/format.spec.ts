import { LcrGamePlaceChip } from "../../../../src/lcr/process/algorithm/lcr-game";
import { format } from "../../../../src/lcr/process/transform/format";

describe('Format', () => {

    it("Should format in a legible way", () => {
        const history = [{
            player: 1,
            chips: 3,
            placeChip: LcrGamePlaceChip.PLAYER,
            winner: false,
            nextRoll: true
        }];

        const result = format(history);

        expect(result).toBe("Player 1: 3(*)");
    });

    it("Should print an empty output if we do not have an history", () => {
        const history = [];

        const result = format(history);

        expect(result).toBe("");
    });

})