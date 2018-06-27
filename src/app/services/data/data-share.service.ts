import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject } from 'rxjs';

import { User, MessageOutput, Game } from '../../interfaces/interfaces';

@Injectable()
export class DataShareService{
    public user: Subject<User> = new BehaviorSubject<User>(null);
    public message: Subject<MessageOutput> = new BehaviorSubject<MessageOutput>(null);

    public game: Subject<Game> = new BehaviorSubject<Game>(null);
    public connected: Subject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(){}

    public changeMessage(message: MessageOutput){
        this.message.next(message);
    }
    
    public changeUser(user: User){
        this.user.next(user);
    }

    public changeGame(game: Game){
        this.game.next(game);
    }

    public clearAllValues(){
        this.user.next(null);
        this.message.next(null);
        this.game.next(null);
    }
}