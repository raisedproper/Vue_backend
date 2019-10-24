var ActivityModel = require("../models/Activity");
var InboxModel = require("../models/Inbox");
var ConversationModel = require("../models/Conversation");
var ConnectionModel = require("../models/Connection");

module.exports = function() {
    var AllChats = [];
    var sentBySender;
    var Sender;
    const conversations = await ConversationModel.find({
      $or: [{ senderId: id }, { recieverId: id }]
    })
      .populate({
        path: "recieverId",
        populate: {
          path: "recieverId",
          model: "User"
        }
      })
      .populate({
        path: "senderId",
        model: "User"
      })
      .populate({
        path: "chats",
        model: "Chat",
        options: { sort: { _id: "-1" } }
      });
  
    console.log("conversation", conversations);
  
    conversations.map(person => {
      if (person.chats[person.chats.length - 1].senderId.equals(id)) {
        Sender = true;
      } else {
        Sender = false;
      }
  
      if (person.chats[0].senderId.equals(id)) {
        sentBySender = true;
        console.log(sentBySender);
      } else {
        sentBySender = false;
        console.log(sentBySender);
      }
  
      AllChats.push({
        recieverId: Sender == true ? person.recieverId._id : person.senderId._id,
        firstName:
          Sender == true
            ? person.recieverId.firstName
            : person.senderId.firstName,
        profilePicturePath:
          Sender == true
            ? person.recieverId.profile.profilePicturePath
            : person.senderId.profile.profilePicturePath,
        lastName:
          Sender == true ? person.recieverId.lastName : person.senderId.lastName,
        address:
          Sender == true
            ? person.recieverId.profile.address
            : person.senderId.profile.address,
        message: person.chats[0].messageBody,
        readMessage: sentBySender == true ? true :person.chats[0].readMessage ,
        sentBysender: sentBySender
      });
    });
    return AllChats
}