import { UserMessageData } from './usermessagedata';
import { RollMessageData } from './rollmessagedata';
import { ItemMessageData } from './itemmessagedata';

export interface OnlineUser {
    umd: UserMessageData,
    rmd: RollMessageData,
    imd: ItemMessageData
}