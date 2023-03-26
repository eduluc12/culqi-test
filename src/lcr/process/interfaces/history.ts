export interface History<T>{
    save(payload : T) : void;
    append(history : History<T>) : void;
    clear() : void;
    getAll() : T[]
}