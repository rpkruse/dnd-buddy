import { Component, AfterViewChecked, OnInit, ViewChild, ElementRef } from '@angular/core';

import { MessageService, DataShareService } from '../../services/services';

import { ChatMessageData, Game, User } from '../../interfaces/interfaces';

@Component({
  selector: 'app-play-chat',
  templateUrl: './play-chat.component.html',
  styleUrls: ['./play-chat.component.css', '../../global-style.css'] //'./play-chat.component.scss']
})
export class PlayChatComponent implements OnInit {
  @ViewChild('chatMessageBox') private chatMessageContainer: ElementRef;
  chatMessages: ChatMessageData[] = [];
  isAlive: boolean = true;

  user: User;
  game: Game;

  hidden: boolean = false;
  privateMessage: boolean = false;
  message: string = "";
  sendTo: string = "Group";

  constructor(private _messageService: MessageService, private _dataShareService: DataShareService) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);
    this._dataShareService.game.takeWhile(() => this.isAlive).subscribe(res => this.game = res);

    this._messageService.chatMessages.takeWhile(() => this.isAlive).subscribe(res => this.getNewChatMessage(res));
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  /*
    This method is called when the user sends a message to the group or individual
  */
  public sendMessage() {
    if (!this.message.length) return; //If we don't have a message to send we return

    this.parseMessage();

    if (!this.message.length) return; //If we don't have a message after parsing we return

    let cmd: ChatMessageData = this.createCMD(this.sendTo)

    if (cmd) {
      this._messageService.sendMessage(cmd, this.privateMessage); //send the message
    }

    this.message = "";
  }

  /*
    This method is called when we need to create a new chat message data object
    @param username: string - The user we want to send a private message to
    @return ChatMessageData
  */
  private createCMD(username: string): ChatMessageData {
    let cmd: ChatMessageData;
    let index;
    if (this.privateMessage) {
      index = this._messageService.groupMembers.findIndex(x => x.umd.name.split("(")[0].toLowerCase().trim() === username.toLowerCase().trim());
      if (index < 0) {
        this.sendTo = "Group";
        return;
      }
    }

    cmd = {
      groupName: this.game.name,
      username: this.user.username,
      message: this.message,
      connectionId: this.privateMessage ? this.getGroupMemberID(index) : "",
      isPrivate: this.privateMessage
    };

    return cmd;
  }

  /*
    This method is called when we need to get the connection id from a user that 
    we want to send a private message to
    @index: number - The index of the member in the group members array
    @return string - The connection id of member at index "index"
  */
  private getGroupMemberID(index: number): string {
    return this._messageService.groupMembers[index].umd.id;
  }

  /*
    This method is called whenever the user attempts to send a message it has the following command options:
      none send to last chat type
      /s Global Chat
      /w Whisper (private chat)
      /r reply
      /h help
  */
  private parseMessage() {
    let split: string[] = this.message.split(/(\/s|\/w|\/r|\/h)/g).filter(x => x.length > 0);

    //Help Menu:
    if (split[0] === '/h') {
      this.addHelpMenu();
      this.message = "";
      return;
    }

    //Send message (no /<command>):
    if (split.length == 1) {
      this.message = split[0];
      return;
    }

    //Split the command and message
    split[0] = split[0].trim();
    split[1] = split[1].trim();

    let isReply: boolean = split[0] === '/r';

    //If we are replying, attempt to find someone to reply to otherwise ignore
    if (isReply) {
      for (let i = this.chatMessages.length - 1; i >= 0; i--) {
        let msg: ChatMessageData = this.chatMessages[i];
        if (msg.username === this.user.username) continue;

        if (msg.isPrivate) {
          this.sendTo = msg.username;
          this.privateMessage = true;
          this.message = split[1];
        }
      }
      return;
    }

    let isPrivate: boolean = split[0] === '/w';

    //If private, try to find user to send to else ignore
    if (isPrivate) {
      let msgD: string[] = split[1].split(/([A-Za-z]+)\s/).filter(x => x.length > 0);

      let username: string = msgD[0].trim();

      let index: number = -1;

      let msg: string = "";
      for (let i = 1; i < msgD.length; i++) {
        msg += msgD[i];
        if (i !== msgD.length - 1) msg += " ";
      }

      this.message = msg;

      this.sendTo = username;
      this.privateMessage = true;
    } else { //Switching to global so send to all
      this.message = split[1];
      this.privateMessage = false;
      this.sendTo = "Group";
    }
  }

  /*
    This method is called when we get a new chat message, it updates our list for the DOM
    @param msgs: ChatMessageData[] - An array of chat messages
  */
  private getNewChatMessage(msgs: ChatMessageData[]) {
    this.chatMessages = msgs;
  }

  /*
    This method is called everytime the page is updated. It will scroll our message list to the bottom
  */
  private scrollToBottom() {
    try {
      this.chatMessageContainer.nativeElement.scrollTop = this.chatMessageContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  /*
    Returns if the message is our own or not
  */
  public isUsersMessage(msg: ChatMessageData): boolean {
    return msg.username === this.user.username;
  }

  /*
    Sets text color based on message type (private or not)
  */
  public getMessageColor(msg: ChatMessageData): string {
    if (!msg) return;

    if (msg.isPrivate) return 'message-purple';

    return 'message-black';
  }

  /*
    This method is called when the user types '/h' to get the help menu
  */
  private addHelpMenu() {
    let cmd: ChatMessageData = {
      connectionId: "",
      groupName: "",
      isPrivate: true,
      message: "/s <message> - to send message to group",
      username: "Chat Bot"
    };
    this.chatMessages.push(cmd);

    let cmd2: ChatMessageData = {
      connectionId: "",
      groupName: "",
      isPrivate: true,
      message: "/w <username> <message> - to send private message to user",
      username: "Chat Bot"
    };
    this.chatMessages.push(cmd2);

    let cmd3: ChatMessageData = {
      connectionId: "",
      groupName: "",
      isPrivate: true,
      message: "/h - to get help menu",
      username: "Chat Bot"
    };
    this.chatMessages.push(cmd3);
  }

  ngOnDestroy() {
    this.isAlive = false;
  }
}
