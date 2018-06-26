import { Character } from './character';
import { User } from './user'

export interface Game {
    gameId: number,
    name: string,
    userId: number,
    GM: boolean,

    character: Character[],
    user: User;
}