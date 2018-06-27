import { Character } from './character';
import { User } from './user'

export interface Game {
    gameId: number,
    name: string,
    userId: number,

    character: Character[],
    user: User;
}