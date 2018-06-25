import { Character } from './character';
import { Game } from './game';

export interface User{
    userId: number,
    username: string,
    password: string,
    character: Character[],
    game: Game[]
}