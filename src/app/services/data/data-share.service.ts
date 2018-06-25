import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject } from 'rxjs';

import { User } from '../../interfaces/interfaces';

@Injectable()
export class DataShareService{
    public user: Subject<User> = new BehaviorSubject<User>(null);

    constructor(){}

    public changeUser(user: User){
        this.user.next(user);
    }

    public clearAllValues(){
        this.user.next(null);
    }
}