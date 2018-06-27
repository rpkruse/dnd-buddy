import { MessageType } from './messagetype.enum';

export interface MessageOutput{
    message: string,
    action: string,
    level: MessageType
}