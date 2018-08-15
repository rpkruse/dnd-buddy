import { Results } from '../results';

export interface SubClass {
    index: number,
    class: Results,
    name: string,
    subclass_flavor: string,
    desc: string,
    features: [Results],
    spells: [
        {
            spell: Results,
            prerequisites: string,
            level_acquired: number
        }
    ],
    url: string
}