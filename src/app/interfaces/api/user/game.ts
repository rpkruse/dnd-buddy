import { Character } from './character';
import { User } from './user'

export interface Game {
    gameId: number,
    name: string,
    userId: number,
    gameState: string

    character: Character[],
    user: User;
}