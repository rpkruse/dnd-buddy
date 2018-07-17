import { Results } from '../results';

export interface Skills {
    index: number,
    name: string,
    desc: string,
    ability_score: Results,
    url: string
}

/*"index": 1,
	"name": "Acrobatics",
	"desc": ["Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation, such as when you’re trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship’s deck. The GM might also call for a Dexterity (Acrobatics) check to see if you can perform acrobatic stunts, including dives, rolls, somersaults, and flips."],
	"ability_score": {
		"url": "https://dnd-5e-api.herokuapp.com/api/ability-scores/1",
		"name": "STR"
	},
	"url": "https://dnd-5e-api.herokuapp.com/api/skills/1"*/