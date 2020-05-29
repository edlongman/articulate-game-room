const User = require('./user');
const Zone = require('./zone');
const Collection = require('./collection');
const Players = require('./players');
const {Image, Dice} = require('./cards');
const {Union, Duplicator} = require('./union');
const EventEmitter = require('events');
const {makeId, shuffle, getRandomInt} = require('./gameUtil');
class ChameleonGame extends EventEmitter{
  duplicator = null;
  dealer_set = null;
  dealer_observer = new Zone();
  dice = new Dice("Roller", ['A1','A2','A3','A4',
                   'B1','B2','B3','B4',
                   'C1','C2','C3','C4',
                   'D1','D2','D3','D4']);
  chameleon_card = new Dice("Chameleoner", ['You are the chameleon']);
  topic_cards = new Zone(new Union("Topics"));
  players = new Players();
  admin = new User("Admin", null);
  feed = new EventEmitter();
  play_zone = null;
  id = makeId(5, 'ABCDEFGHJKMNPQRSTUVWXYZ23456789');//Select visually unambiguous chars
  constructor(){
    super();
    this.duplicator=new Duplicator("Roll duplicator", [this.dice], this.players.length);
    this.dealer_set = new Union("Role cards",[this.duplicator, this.chameleon_card], true);
    this.dealer_observer = new Zone(this.dealer_set);
    this.dealer_observer.masked = "Hidden Dice card";
    this.admin.subscribeZone(this.dealer_observer);
    this.play_zone = new Zone(new Collection("Topic"));
    this.dealer_set.on("regenerate", (info)=>{
      this.emit("regenerate", info);
    });
    this.on('regenerate', (info)=>{ 
      this.feed.emit('log', {text: 'Generator updated: ' + info});
    });
    this.admin.hand = this.topic_cards;
    this.admin.subscribeDefaults(); // TODO: User.changeHand(new collection)
    this.players.subscribeZone(this.play_zone);
    this.feed.on('discard', this.players.feedDiscard.bind(this.players));
    this.on('cards', this.topic_cards.extend.bind(this.topic_cards));
  }
  connectAdmin(socket){
    if(!this.admin.updateSocket(socket)){
      return false;
    }
    this.admin.conn.on("roll",this.dice.generate.bind(this.dice));
    this.admin.conn.emit("enable_action", {id: "roll", name: "Reroll the Chameleon Dice"});
    this.admin.conn.on("deal",this.deal.bind(this));
    this.admin.conn.emit("enable_action", {id: "deal", name: "Deal the Roll to the players"});
    this.admin.conn.on("play",this.deal_topic.bind(this));
    this.admin.conn.emit("enable_action", {id: "play", name: "Play the first card Hand to Topic"});
    this.admin.sendZone(this.dealer_observer);
    this.feed.on('discard', (card) => {
      if(card instanceof Object){// TODO: instance of "Card" class
        this.admin.conn.emit("feed",{text: "Discarded text:" + card.text + ", src: " + card.src});
      }
    });
    this.feed.on('log', (data)=>this.admin.conn.emit("feed", data));
    this.feed.on('feed', (data)=>this.admin.conn.emit("feed", data));
    return true;
  }
  addPlayer(name, socket){
    const name_blacklist = ['', null, 'admin', 'null', 'undefined', undefined];
    if(name_blacklist.indexOf(name.toLowerCase())>=0){
      return false;
    }
    const new_player = this.players.add(name, socket);
    if(new_player == false){
      return false;
    }
    //Notify the other players of joining
    socket.broadcast.emit('feed', { text: name + " joined the game" });
    socket.emit('feed', {text: this.currentPlayersString()});
    this.duplicator.multiplier = this.players.length - 1;

    //If the new_player is a user type then do the setup and subscriptions
    if(new_player instanceof User){
      this.admin.conn.emit("players", this.currentPlayersString());
      new_player.on('disconnect', this.removePlayer.bind(this));
      new_player.subscribeZone(this.play_zone);
    }
    return new_player;
  }
  removePlayer(name){
    name = String(name);
    if(this.players.removeByName(name)){
      this.feed.emit('feed', {text: name + " left the game"});
      this.admin.conn.emit("players", this.currentPlayersString());
      this.duplicator.multiplier = this.players.length - 1;
    }
  }
  deal(){
    this.players.emptyHands.call(this.players, this.feed);
    this.players.deal(this.dealer_set.deal());
  }
  deal_topic(){
    this.play_zone.empty();
    const topic_card = this.topic_cards.draw();
    if(topic_card==false){
      return false;
    }
    this.play_zone.add(topic_card);
  }
  currentPlayersString(){
    if(this.players.length<1){
      return "There are no players";
    }
    return "Current players are: " + this.players.names.join(", ");
  };
}


module.exports = ChameleonGame;
