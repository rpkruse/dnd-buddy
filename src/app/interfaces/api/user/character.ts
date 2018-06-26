import { Game } from './game';
import { User } from './user'

export interface Character {
    characterId: number,
    name: string,
    class: string, //Url
    race: string, //Url
    abil_score_str: number,
    abil_score_dex: number,
    abil_score_con: number,
    abil_score_int: number,
    abil_score_wis: number,
    abil_score_cha: number,
    level: number,
    userId: number,
    gameId: number,
    user: User,
    game: Game
}