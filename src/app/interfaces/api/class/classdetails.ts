import { ProficiencyChoices } from '../proficiencychoices';

export interface ClassDetails {
    _id: string,
    index: number,
    name: string,
    hit_die: number,
    proficiency_choices: ProficiencyChoices[], //Gets returned as array value, so we need to cast it
    proficiencies: {
        url: string,
        name: string
    },
    saving_throws: [
        {
            url: string,
            name: string
        }
    ],
    starting_equipment: {
        url: string,
        class: string
    },
    class_levels: {
        url: string,
        class: string
    },
    subclasses: {
        name: string,
        url: string
    },
    required_subclass: boolean,
    url: string
};