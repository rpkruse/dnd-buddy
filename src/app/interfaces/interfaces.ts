//Our database info:
import { Character } from '../interfaces/api/user/character';
import { Game } from '../interfaces/api/user/game';
import { User } from '../interfaces/api/user/user';

import { Class } from '../interfaces/api/class/class';
import { ClassDetails } from '../interfaces/api/class/classdetails';
import { ClassLevels } from '../interfaces/api/class/classlevels';

import { Race } from '../interfaces/api/race/race';
import { RaceDetails } from '../interfaces/api/race/racedetails';
import { SubRace } from '../interfaces/api/race/subrace';

import { ProficiencyChoices } from '../interfaces/api/proficiencychoices';

//Snackbar interfaces
import { MessageOutput } from '../interfaces/ui/messageoutput'
import { MessageType } from '../interfaces/ui/messagetype.enum';

//Message interfaces (signalR)
import { UserMessageData } from '../interfaces/messages/usermessagedata'
import { ItemMessageData } from '../interfaces/messages/itemmessagedata'
import { RollMessageData } from '../interfaces/messages/rollmessagedata'
import { OnlineUser } from '../interfaces/messages/onlineuser';

//Spell Data:
import { Spell } from '../interfaces/api/spell/spell'
import { SpellDetails } from '../interfaces/api/spell/spelldetail'

export {
    Character,
    Game,
    User,
    Class,
    ClassDetails,
    ClassLevels,
    Race,
    RaceDetails,
    SubRace,
    ProficiencyChoices,
    MessageOutput,
    MessageType,
    UserMessageData,
    ItemMessageData,
    RollMessageData,
    OnlineUser,
    Spell,
    SpellDetails
};