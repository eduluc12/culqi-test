export interface Consumer<T = any>{
    entry(sequence : string) : void,
    consume() : T;
    leftToConsume() : number;
    isFinished() : boolean;
}