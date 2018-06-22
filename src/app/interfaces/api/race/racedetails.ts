import { Results } from '../results';
import { ProficiencyChoices } from '../proficiencychoices';

export interface RaceDetails {
    _id: string,
    index: number,
    name: string, //d
    speed: number, //d 
    ability_bonuses: string[], //d
    alignment: string, //d
    age: string, //d 
    size: string, //d
    size_description: string, //d
    starting_proficiencies: Results[], //d
    starting_proficiency_options: ProficiencyChoices, //d
    languages: Results[], //d
    language_desc: string, //d
    traits: Results[], //d 
    subraces: Results[], //d
    url: string
};