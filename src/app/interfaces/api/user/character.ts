import { Game } from './game';
import { User } from './user'

export interface Character {
    characterId: number,
    name: string,
    class: string, //Url
    race: string, //Url
    abil_Score_Str: number,
    abil_Score_Dex: number,
    abil_Score_Con: number,
    abil_Score_Int: number,
    abil_Score_Wis: number,
    abil_Score_Cha: number,
    level: number,
    armor: string,
    weapon: string,
    shield: string,
    neck: string,
    ring_1: string,
    ring_2: string,
    xp: number,
    userId: number,
    gameId: number,
    user: User,
    game: Game
}