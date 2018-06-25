import { Game } from './game';
import { User } from './user'

export interface Character {
    characterId: number,
    name: string,
    userId: number,
    gameId: number,
    user: User,
    game: Game
}