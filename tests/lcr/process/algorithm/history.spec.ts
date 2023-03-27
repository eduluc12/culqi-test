import { SimpleHistory } from "../../../../src/lcr/process/algorithm/history";
import type { History } from "../../../../src/lcr/process/algorithm/interfaces";

describe('History', () => {


    test("Should save in history", () => {
        const simpleHistory = new SimpleHistory<string>();
        const payload = "test payload";

        simpleHistory.save(payload);

        expect(simpleHistory.getAll()).toContain(payload);
    });

    test("Should clear the history", () => {
        const simpleHistory = new SimpleHistory<string>();
        simpleHistory.save("test payload");

        simpleHistory.clear();

        expect(simpleHistory.getAll()).toHaveLength(0);
    });

    test("Should not affect history when we append another history", () => {
        const simpleHistory = new SimpleHistory<string>();
        const emptyHistory: History<string> = {
            save: jest.fn(),
            append: jest.fn(),
            clear: jest.fn(),
            getAll: jest.fn().mockReturnValue([])
        };

        simpleHistory.append(emptyHistory);

        expect(simpleHistory.getAll()).toHaveLength(0);
    });

    test("Should get the whole history when we call the getAll() method", () => {
        const simpleHistory = new SimpleHistory<string>();
        const payload1 = "test payload 1";
        const payload2 = "test payload 2";
        simpleHistory.save(payload1);
        simpleHistory.save(payload2);

        const result = simpleHistory.getAll();

        expect(result).toHaveLength(2);
        expect(result).toContain(payload1);
        expect(result).toContain(payload2);
    });

    test("Should concat two histories", () => {
        // Arrange
        const simpleHistory1 = new SimpleHistory<string>();
        const simpleHistory2 = new SimpleHistory<string>();
        const payload1 = "test payload 1";
        const payload2 = "test payload 2";
        simpleHistory1.save(payload1);
        simpleHistory2.save(payload2);

        // Act
        simpleHistory1.append(simpleHistory2);

        // Assert
        expect(simpleHistory1.getAll()).toHaveLength(2);
        expect(simpleHistory1.getAll()).toContain(payload1);
        expect(simpleHistory1.getAll()).toContain(payload2);
    });

});