var express = require("express");
var router = express.Router();
var routeAuthentication = require("../middleware/authentication");
var ConversationModel = require("../models/Conversation");
var ChatModel = require("../models/Chat");
var UserModel = require("../models/User");

const io = require("socket.io")(3001);
var date = new Date();
var moment = require("moment");

io.on("connection", function(socket) {
  socket.on("send_message", async function(msg) {
    var conversationId;
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
        createdAt: date,
        updatedAt: date
      });

      let result = await newConversation.save();
      if (result) {
        console.log("New conversation saved", result);
        conversationId = result.id;

        let user1 = await UserModel.findById(msg.senderId);
        let user2 = await UserModel.findById(msg.recieverId);
        if (user1 && user2) {
          user1.recievers.push(conversationId);
          await user1.save()

          user2.recievers.push(conversationId);
          await user2.save()
        }
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
    if (newMessage) {
      console.log("newMessage", newMessage);
      io.emit("recieve_message", newMessage);
    }
  });
});

async function createMessage(obj) {
  var message = new ChatModel({
    messageBody: obj.messageBody,
    conversationId: obj.conversationId,
    senderId: obj.senderId,
    recieverId: obj.recieverId,
    readMessage: obj.readMessage,
    showToSender: true,
    showToReceiver: true,
    createdAt: date,
    updatedAt: date
  });

  let saveMessage = await message.save();
  if (saveMessage) {
    console.log("Message saved", saveMessage);
    return {
      status: 200,
      message: "message sent successfully",
      response: {
        message: saveMessage.messageBody,
        senderId: saveMessage.senderId,
        date: saveMessage.createdAt
      }
    };
  } else {
    console.log("error saving message");
    return { status: 400, message: "message sending unsuccessfull" };
  }
}

//   const nsp = io.of("/conversation");
//   nsp.on("connection", async function(socket) {
//     socket.on("connection", message => {
//       console.log(message);
//     });
//     //socket.on("createMessage", async incomingMessage => {

//        let c = await  ConversationModel.find({members: {
//                 senderId: incomingMessage.senderId,
//                 recieverId: incomingMessage.recieverId
//               }
//             })

//            res.send(c)
//     //   ConversationModel.find(
//     //     {
//     //       members: {
//     //         senderId: incomingMessage.senderId,
//     //         recieverId: incomingMessage.recieverId
//     //       }
//     //     },
//     //     async function(err, response) {
//     //       var conversationId;
//     //       if (response.length != 0) {
//     //         console.log("existingConversation", response);
//     //         conversationId = response[0].id;

//     //         let createMessageObj = {
//     //           messageBody: incomingMessage.message,
//     //           ConversationId: conversationId,
//     //           senderId: incomingMessage.senderId,
//     //           recieverId: incomingMessage.recieverId
//     //         };
//     //         let result = await createMessage(createMessageObj);
//     //         if(result){
//     //         return res.json(result);
//     //         }
//     //       } else if (response.length == 0) {
//     //         let members = new ConversationModel({
//     //           members: [
//     //             {
//     //               senderId: incomingMessage.senderId,
//     //               recieverId: incomingMessage.recieverId
//     //             }
//     //           ],
//     //           createdAt: date,
//     //           updatedAt: date
//     //         });
//     //         members.save(async function(err, response) {
//     //           if (response) {
//     //             console.log("conversation saved", response);
//     //             conversationId = response.id;
//     //             let createMessageObj = {
//     //               messageBody: incomingMessage.message,
//     //               ConversationId: conversationId,
//     //               senderId: incomingMessage.senderId,
//     //               recieverId: incomingMessage.recieverId
//     //             };
//     //             let result = await createMessage(createMessageObj);
//     //            return res.json(result);
//     //           } else if(err){
//     //             console.log("error while saving conversation", err);
//     //           }
//     //         });
//     //       }
//     //     }
//     //   );
//     //});
//   });
