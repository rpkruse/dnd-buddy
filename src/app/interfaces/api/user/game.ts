import { Character } from './character';
import { User } from './user'

export interface Game {
    gameId: number,
    name: string,
    userId: number,
    GM: boolean,

    characters: Character[],
    user: User;
}