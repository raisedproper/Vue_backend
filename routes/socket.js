var ConversationModel = require("../models/Conversation");
var ChatModel = require("../models/Chat");
var UserModel = require("../models/User");
var notification = require("../middleware/notification").getNotifications;
var moment = require("moment");
var getInbox = require("../middleware/inbox");
var getCount = require("../middleware/count");
var pushNotification = require("../middleware/pushNotification");

module.exports = {
  start: function(soc, nsp) {
    soc.on("send_message", async msg => {
      var conversationId;
      var newconversation = false;
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
          newconversation = false;
        } else {
          console.log("conversation not", existingConversation);
          newconversation = true;
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
              date: moment(newMessage.date).format("YYYY-MM-DD hh:mm:ss")
            }
          };
          if (newconversation == true) {
            var senderInbox = await getInbox(newMessage.senderId);
            console.log("sendinbox", senderInbox);

            var recieverInbox = await getInbox(newMessage.recieverId);
            console.log("recieverInbox", recieverInbox);
          }
          console.log(`recieve_message/${newMessage.recieverId}`);
          nsp.emit(`recieve_message/${newMessage.recieverId}`, message);
          nsp.emit(`recieve_message/${newMessage.senderId}`, message);
          let sender = await UserModel.findById(msg.senderId);
          let reciever = await UserModel.findById(msg.recieverId);
          var activityObj;
          if (sender) {
            console.log("gettime", moment(newMessage.date).format("LT"));
            activityObj = {
              firstName: sender.firstName,
              text: `${sender.firstName} sent you a message`,
              type: "message",
              address: sender.location.coordinates,
              emailAddress: sender.profile.emailAddress,
              profilePicturePath: `${sender.profile.profilePicturePath}`,
              time: moment(newMessage.date).format("LT"),
              status: false
            };
            console.log("activity", activityObj);
            await notification(newMessage.recieverId, activityObj);
            let count1 = await getCount(newMessage.recieverId);
            nsp.emit(`/${newMessage.recieverId}`, {
              id: newMessage.recieverId,
              count: count1
            });

            let count2 = await getCount(newMessage.senderId);
            nsp.emit(`/${newMessage.senderId}`, {
              id: newMessage.senderId,
              count: count2
            });

            pushNotification(reciever.fcmToken, activityObj);
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
