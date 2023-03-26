import type { History } from './interfaces'

export class SimpleHistory<T> implements History<T>{
    
    private history : T[] = [];

    save(payload : T): void {
        this.history.push(payload);
    }

    clear(): void {
        this.history = []
    }

    getAll(): T[] {
        return this.history;
    }

    append(history: History<T>): void {
        const getAllHistory = history.getAll();
        this.history = [
            ...this.history,
            ...getAllHistory,
        ]
    }
    
}