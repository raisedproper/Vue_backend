var express = require("express");
var router = express.Router();
var routeAuthentication = require("../middleware/authentication");
var ConversationModel = require("../models/Conversation");
var ChatModel = require("../models/Chat");

const io = require("socket.io")(3001);
var date = new Date();

io.on("connection", function(socket) {
  socket.on("send_message", async function(msg) {
    console.log("ss");
    var conversationId;
    let existingConversation = await ConversationModel.findOne({
      senderId: msg.senderId,
      recieverId: msg.recieverId
    });

    if (existingConversation) {
      console.log("conversation exists", existingConversation);
      conversationId = existingConversation.id
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
      } else {
        console.log("New conversation not saved", result);
      }
    }
    let createMessageObj = {
        messageBody: msg.message,
        ConversationId: conversationId,
        senderId: msg.senderId,
        recieverId: msg.recieverId
      };
      let newMessage = await createMessage(createMessageObj);
      if (newMessage) {
          io.emit('send_message',newMessage)
         console.log(newMessage)
      }
  });
});

async function createMessage(obj) {
  var message = new ChatModel({
    messageBody: obj.messageBody,
    ConversationId: obj.conversationId,
    senderId: obj.senderId,
    recieverId: obj.recieverId,
    createdAt: date,
    updatedAt: date
  });
console.log('message to be saved',message)
  let saveMessage = await message.save();
  if (saveMessage) {
    console.log("Message saved", saveMessage);
    return { status: 200, message: "message sent successfully", response:{messageId: saveMessage.id} };
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
