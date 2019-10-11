var express = require("express");
var router = express.Router();
var ConversationModel = require("../models/Conversation");
var ChatModel = require("../models/Chat");
var UserModel = require("../models/User");

const io = require("socket.io")(3001);
var date = new Date();
var moment = require("moment");
var soc;
 io.on("connection", function(socket) {
   console.log('socket connected')
   soc = socket

  socket.on("send_message", async function(msg) {
    socket.join(msg.recieverId);

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
    console.log('conversation',conversation)
    conversation.chats.push(newMessage.id);
    await conversation.save();

    if (newMessage) {
      let message = {
        status: 200,
        message: "message sent successfully",
        response: {
          message: newMessage.message,
          senderId: newMessage.senderId,
          date: newMessage.date
        }
      }
      io.sockets.in(msg.recieverId).emit("recieve_message", message);
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
      id: saveMessage.id,
        message: saveMessage.messageBody,
        senderId: saveMessage.senderId,
        date: saveMessage.createdAt
    };
  } else {
    console.log("error saving message");
    return { status: 400, message: "message sending unsuccessfull" };
  }
}

module.exports = soc
