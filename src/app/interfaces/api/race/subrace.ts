import { Results } from '../results';
import { ProficiencyChoices } from '../proficiencychoices';

export interface SubRace {
    index: number,
    name: string,
    desc: string,
    ability_bonuses: number[],
    age: string,
    alignment: string,
    preferred_class: string,
    size: string,
    speed: string,
    starting_proficiencies: Results[],
    starting_proficiency_options: ProficiencyChoices,
    languages: Results[],
    racial_traits: Results[],
    url: string
}