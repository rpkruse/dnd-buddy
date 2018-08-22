import { Results } from '../results';

export interface Feature {
    index: number,
    name: string,
    level: number,
    url: string,
    desc: string[],
    subclass: Results,
    class: Results
}