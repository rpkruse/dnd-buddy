import { Results } from '../results';

export interface Equipment {
    id: string,
    index: number,
    name: string,
    equipment_category: string,
    desc?: string,
    charge_spell?: {
        cost: number,
        save?: string,
        name: string
    },
    rank?: string,
    armor_category?: string,
    armor_class?: {
        base: 11,
        dex_bonus: boolean,
        max_bonus?: any
    }
    weapon_category?: string,
    weapon_range?: string,
    cost: {
        quantity: number,
        unit: string
    },
    damage?: {
        dice_count: number,
        dice_value: number,
        damage_type: Results
    }
    range?: {
        normal: number,
        long?: any
    }
    weight: number,
    properties: Results[]
    url: string
}