/**
 * This interface is pulled from the 5e api it is used to turn into our DB monster object
 */
export interface ApiMonster {
    index: number,
    name: string,
    size: string,
    type: string,
    subtype: string,
    alignment: string,
    armor_class: number,
    hit_points: number, //Base starting HP
    hit_dice: string, //nDn
    speed: string,
    strength: number,
    dexterity: number,
    constitution: number,
    intelligence: number,
    wisdom: number,
    charisma: number,
    strength_save?: number,
    dexterity_save?: number,
    constitution_save?: number,
    intelligence_save?: number,
    wisdom_save?: number,
    charisma_save?: number,
    damage_vulnerabilities: string,
    damage_resistances: string,
	damage_immunities: string,
	condition_immunities: string,
	senses: string,
	languages: string,
    challenge_rating: number,
    special_abilities: [
        {
            attack_bonus: number,
            desc: string,
            name: string
        }],
    actions: [
        {
            attack_bonus?: number
            damage_bonus?: number,
            damage_dice?: string, //nDn
            desc: string,
            name: string //Weapon name
        }],
    url: string
}