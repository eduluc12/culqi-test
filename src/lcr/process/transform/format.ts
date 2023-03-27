import {type LcrGameHistory, LcrGamePlaceChip} from '../algorithm/lcr-game'

export const format = (history : LcrGameHistory[]) => {
    const getAllHistory = history;
    return getAllHistory.map(({ player, chips, placeChip, winner, nextRoll }) => {
        if (placeChip === LcrGamePlaceChip.PLAYER) {
            let output = `Player ${player}: ${chips}`;
            output += winner ? '(W)' : '';
            output += nextRoll ? '(*)' : '';
            return output;
        }
        return `Center: ${chips}`;
    }).join(' | ');
}