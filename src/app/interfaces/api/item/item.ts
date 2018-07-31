import { Character } from "../user/character";

export interface Item {
    itemId: number,
    name: string,
    url: string,
    count: number,
    canEquip: boolean,
    characterId: number,
    character: Character
}