import { Character } from './character';
import { User } from './user'

export interface Game {
    gameId: number,
    name: string,
    gameState: string,
    open: boolean, 
    userId: number,

    character: Character[],
    user: User;
}