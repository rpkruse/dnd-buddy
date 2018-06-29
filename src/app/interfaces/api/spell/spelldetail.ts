import { Results } from '../results';
export interface SpellDetails {
    id: string,
    index: number,
    name: string,
    desc: string,
    higher_level?: string,
    page: string,
    range: string,
    components?: string[]
    material?: string,
    ritual: string,
    duration: string,
    concentration: string,
    casting_time: string,
    level: number,
    school: Results,
    classes: Results[],
    subclasses: Results[],
    url: string
}