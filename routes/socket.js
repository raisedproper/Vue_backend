var express = require("express");
var ConversationModel = require("../models/Conversation");
var ChatModel = require("../models/Chat");
var UserModel = require("../models/User");
var notification = require("../middleware/notification").getNotifications;
var moment = require("moment");

module.exports = {
  start: function(soc, nsp) {
    console.log('hgj')
    soc.on("send_message", async(msg) => {
      console.log('here sokcet')
      var conversationId;
      if (msg.recieverId) {
        let existingConversation = await ConversationModel.findOne({
          $or: [
            { senderId: msg.senderId, recieverId: msg.recieverId },
            { senderId: msg.recieverId, recieverId: msg.senderId }
          ]
        });

        if (existingConversation) {
          console.log("conversation exists", existingConversation);
          conversationId = existingConversation.id;
        } else {
          console.log("conversation not", existingConversation);
          let newConversation = new ConversationModel({
            senderId: msg.senderId,
            recieverId: msg.recieverId,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          let result = await newConversation.save();
          if (result) {
            console.log("New conversation saved", result);
            conversationId = result.id;
          } else {
            console.log("New conversation not saved", result);
          }
        }
        let createMessageObj = {
          messageBody: msg.message,
          conversationId: conversationId,
          readMessage: false,
          senderId: msg.senderId,
          recieverId: msg.recieverId
        };

        let newMessage = await createMessage(createMessageObj);

        let conversation = await ConversationModel.findById(conversationId);
        console.log("conversation", conversation);
        conversation.chats.push(newMessage.id);
        await conversation.save();

        if (newMessage) {
          let message = {
            status: 200,
            message: "message sent successfully",
            response: {
              message: newMessage.message,
              senderId: newMessage.senderId,
              date: moment(newMessage.date).format('YYYY-MM-DD hh:mm:ss')
            }
          };
          nsp.emit("recieve_message", message);
          let sender = await UserModel.findById(msg.senderId);
          var activityObj;
          if (sender) {
            console.log('gettime',moment(newMessage.date).format("LT"))
            activityObj = {
              firstName: sender.firstName,
              text: `${sender.firstName} sends you a message`,
              type: "message",
              address: `${sender.profile.address}`,
              emailAddress: sender.profile.emailAddress,
              profilePicturePath: `${sender.profile.profilePicturePath}`,
              time: moment(newMessage.date).format("LT"),
              status: false
            };

            notification(newMessage.recieverId, activityObj);
          }
        }
      }
    });
  }
};

async function createMessage(obj) {
  var message = new ChatModel({
    messageBody: obj.messageBody,
    conversationId: obj.conversationId,
    senderId: obj.senderId,
    recieverId: obj.recieverId,
    readMessage: obj.readMessage,
    showToSender: true,
    showToReceiver: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  let saveMessage = await message.save();
  if (saveMessage) {
    console.log("Message saved", saveMessage);
    return {
      id: saveMessage.id,
      message: saveMessage.messageBody,
      senderId: saveMessage.senderId,
      recieverId: saveMessage.recieverId,
      date: new Date()
    };
  } else {
    console.log("error saving message");
    return { status: 400, message: "message sending unsuccessfull" };
  }
}

// async function getCount(id) {
//   console.log(id);

//   let notification = await ActivityModel.aggregate([
//     { $match: { userId: id } },
//     { $unwind: "$notifications" },
//     { $match: {'notifications.status': false} }
//   ]);
 
//  let notificationCount = notification.length;
//  console.log(notificationCount)
//  let connection = await ConnectionModel.aggregate([
//   { $match: { userId: id } },
//   { $unwind: "$active" },
//   { $match: {'active.seen': false} }
// ]);

// let connectionCount = connection.length;
// console.log(connectionCount)
// let inbox =  await InboxModel.aggregate([
//   { $match: { userId: id } },
//   { $unwind: "$chats" },
//   { $match: {'chats.readMessage': false} }
// ]); 

// let inboxCount = inbox.length;
// console.log('i',inboxCount)
// let totalCount = notificationCount + connectionCount + inboxCount
// return totalCount
// }
