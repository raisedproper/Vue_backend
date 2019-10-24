var ConversationModel = require("../models/Conversation");
var InboxModel = require("../models/Inbox");
module.exports = async function(id) {
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
      readMessage: sentBySender == true ? true : person.chats[0].readMessage,
      sentBysender: sentBySender
    });
  });
  console.log('all',AllChats)
  if (AllChats) {
    let checkInbox = await InboxModel.findOne({ userId: id });
    if (checkInbox) {
      let updateIndex = await InboxModel.findOneAndUpdate(
        { userId: id },
        { $set: { chats: AllChats } },
        { new: true }
      );
      if (updateIndex) {
        console.log("chats updated",updateIndex);
      }
    } else {
      var createInbox = new InboxModel({
        userId: id,
        chats: AllChats,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      let saveInbox = await createInbox.save();
      if (saveInbox) {
        console.log("inbox saved");
      }
    }
  }

  return AllChats;
};
