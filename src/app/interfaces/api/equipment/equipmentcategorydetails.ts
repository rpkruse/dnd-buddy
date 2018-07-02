import { Results } from '../results';

export interface EquipmentCategoryDetails {
    id: string,
    index: number,
    name: string,
    equipment: Results[],
    url: string
}