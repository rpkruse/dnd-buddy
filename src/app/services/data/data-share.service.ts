import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject } from 'rxjs';

import { User, MessageOutput} from '../../interfaces/interfaces';

@Injectable()
export class DataShareService{
    public user: Subject<User> = new BehaviorSubject<User>(null);
    public message: Subject<MessageOutput> = new BehaviorSubject<MessageOutput>(null);


    constructor(){}

    public changeMessage(message: MessageOutput){
        this.message.next(message);
    }
    
    public changeUser(user: User){
        this.user.next(user);
    }

    public clearAllValues(){
        this.user.next(null);
        this.message.next(null);
    }
}