import { Character } from "../user/character";

export interface Item {
    itemId: number,
    name: string,
    url: string,
    count: number,
    cost: number,
    cost_Type: string,
    canEquip: boolean,
    characterId: number,
    character: Character
}