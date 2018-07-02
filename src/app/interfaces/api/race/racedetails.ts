import { Results } from '../results';

export interface RaceDetails {
    id: string,
    index: number,
    name: string,
    subraces: Results[],
    url: string
}