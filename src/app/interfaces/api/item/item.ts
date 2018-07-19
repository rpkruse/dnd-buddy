import { Character } from "../user/character";

export interface Item {
    itemId: number,
    name: string,
    url: string,
    count: number,
    characterId: number,
    character: Character
}