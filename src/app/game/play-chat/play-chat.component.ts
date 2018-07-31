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

  hidden: boolean = true;
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

  /**
   * Called when the user sends a message to the group or individual
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

  /**
   * Called when we need to create a new chat message data object
   * 
   * @param {string} username The user we want to send a private message to
   * 
   * @returns A new ChatMessageData object 
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

  /**
   * Called when we need to get the connection id from a user that
   * we want to send a private message to
   * 
   * @param {number} index The index of the member in the group members array
   * 
   * @returns The connection id of the member at index "index"
   */
  private getGroupMemberID(index: number): string {
    return this._messageService.groupMembers[index].umd.id;
  }

 /**
  * Called whenever the user attempts to send a message, it has the following command options
  * 
  * "" - Send to the last chat type
  * 
  * 
  * "/s" - Send to global chat
  * 
  * 
  * "/w" - Whisper (private chat)
  * 
  * 
  * "/r" - Reply
  * 
  * "/c" - Clear chat
  * 
  * 
  * "/h" - Help
  */
  private parseMessage() {
    let split: string[] = this.message.split(/(\/s|\/w|\/r|\/h)/g).filter(x => x.length > 0);

    this.message = "";

    //Split the command and message
    if (split.length == 1) split[0] = split[0].trim();

    if (split.length > 1) split[1] = split[1].trim();

    switch (split[0]) {
      case '/s': //Group
        this.sendMessageToGroup(split[1]);
        return;
      case '/r': //Reply
        this.replyToMessage(split[1]);
        return;
      case '/w': //Whisper
        this.sendPrivateMessage(split[1].split(/([A-Za-z]+)\s/).filter(x => x.length > 0));
        return;
      case '/c': //Clear
        this.clearChatMessages();
        return;
      case '/h': //Help
        this.addHelpMenu();
        this.message = "";
        return;
      default: //Send to group
        if (this.sendTo !== "Group") { //If we are replying to a whisper without /w || /r
          this.sendPrivateMessage(split);
          return;
        }
        this.sendMessageToGroup(split[0]);
        return;
    }
  }

  /**
   * Called when the user does the /r command, it finds the last person 
   * to send them a private message and replies to them with the given input
   * 
   * @param {string} messageToSend The message to reply with
   */
  private replyToMessage(messageToSend: string) {
    for (let i = this.chatMessages.length - 1; i >= 0; i--) {
      let msg: ChatMessageData = this.chatMessages[i];
      if (msg.username === this.user.username) continue; //Skip our own messages

      if (msg.isPrivate) {
        this.sendTo = msg.username;
        this.privateMessage = true;
        this.message = messageToSend;
        return;
      }
    }
  }

  /**
   * Called when the user does the /w command OR enters a message while this.sendTo != "Group"
   * 
   * @param {string[]} messageToSend An array of strings [0] -> the username to whisper [1+] the message to send
   */
  private sendPrivateMessage(messageToSend: string[]) {
    let username: string;
    let msg: string = "";

    if (messageToSend.length > 1) { // (/w) command
      username = messageToSend[0].trim();
      for (let i = 1; i < messageToSend.length; i++) {
        msg += messageToSend[i];
        if (i !== messageToSend.length - 1) msg += " ";
      }
    } else { //sending text while whispering (IE no /w command)
      username = this.sendTo;
      msg = messageToSend[0];
    }

    this.message = msg;
    this.sendTo = username;
    this.privateMessage = true;
  }

  /**
   * Called when the user uses the /s command or sends a message with this.sendTo == "Group"
   * it sends a messsage to everyone in the game
   * 
   * @param {string} messageToSend The message to send to the group
   */
  private sendMessageToGroup(messageToSend: string) {
    this.message = messageToSend;
    this.privateMessage = false;
    this.sendTo = "Group";
  }

  /**
   * Called when we get a new chat message, it updates our list for the DOM
   * 
   * @param {ChatMessageData[]} msgs An array of chat messages 
   */
  private getNewChatMessage(msgs: ChatMessageData[]) {
    this.chatMessages = msgs;
  }

  /**
   * Called when the user uses the /c command, it clears all chat messages and
   * resets their sendTo to "Group"
   */
  private clearChatMessages() {
    this._messageService.clearChatMessages();
    this.sendTo = "Group";
  }

  /**
   * Called everytime the page is updated. It auto scrolls our message list (chat) to the bottom
   */
  private scrollToBottom() {
    try {
      this.chatMessageContainer.nativeElement.scrollTop = this.chatMessageContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  /**
   * Called to check we own a message or not
   * 
   * @param {ChatMessageData} msg The message to check
   * 
   * @returns If we are the owner of the message or not 
   */
  public isUsersMessage(msg: ChatMessageData): boolean {
    return msg.username === this.user.username;
  }

  /*
    Sets text color based on message type (private or not)
  */

  /**
   * Sets text color based on message type (private or not)
   * 
   * @param {ChatMessageData} msg The message to check 
   */
  public getMessageColor(msg: ChatMessageData): string {
    if (!msg) return;

    if (msg.isPrivate) return 'message-whisper';

    return 'message-standard';
  }

  /**
   * Called whenever the user types /h. It displays the help menu
   * 
   * [Todo] Rewrite me
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
      message: "/c - to clear chat",
      username: "Chat Bot"
    };
    this.chatMessages.push(cmd3);

    let cmd4: ChatMessageData = {
      connectionId: "",
      groupName: "",
      isPrivate: true,
      message: "/h - to get help menu",
      username: "Chat Bot"
    };
    this.chatMessages.push(cmd4);
  }

  ngOnDestroy() {
    this.isAlive = false;
  }
}
