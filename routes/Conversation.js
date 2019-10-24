var express = require("express");
var router = express.Router();
var ChatModel = require("../models/Chat");
var routeAuthentication = require("../middleware/authentication");

router.use(routeAuthentication);

async function findConversation(recieverId, senderId) {
  var conversations = [];
  let response = await ChatModel.find({
    $or: [
      { senderId: senderId, recieverId: recieverId },
      { senderId: recieverId, recieverId: senderId }
    ]
  });
  if (response) {
    response.map(obj => {
      let object = {
        senderId: obj.senderId,
        message: obj.messageBody,
        date: obj.createdAt
      };
      conversations.push(object);
    });
    return conversations;
  }
}

router.post("/getConversation", async function(req, res) {
  var { recieverId, senderId } = req.body;
  let response = await findConversation(recieverId, senderId);

  try {
    if (response.length > 0) {
      let read = await ChatModel.updateMany(
        {
          $or: [
            { senderId: senderId, recieverId: recieverId },
            { senderId: recieverId, recieverId: senderId }
          ]
        },
        { $set: { readMessage: true, updatedAt: new Date() } }
      );
      if (read) {
        console.log("messages are read");
      } else {
        console.log("messages are not read");
      }

      console.log("conversation fetched successfully", response);
      res.json({
        status: 200,
        message: "conversation fetched successfully",
        response: response
      });
    } else if (response.length == 0) {
      console.log("no conversation");
      res.json({
        status: 202,
        message: "no conversation exists"
      });
    }
  } catch (err) {
    console.log("error fetching conversation", err);
    res.json({
      status: 404,
      message: "error fetching conversation"
    });
  }
});

router.put("/deleteConversation", async function(req, res) {
  var { recieverId, senderId, showToReceiver, showToSender } = req.body;

  let resp = await ChatModel.findOneAndUpdate(
    { senderId: senderId, recieverId: recieverId },
    {
      $set: {
        chats: [],
        showToSender: showToSender,
        showToReceiver: showToReceiver,
        updatedAt: new Date()
      }
    },
    { new: true }
  );
  try {
    if (resp) {
      console.log("conversation removed", resp);
      res.json({
        status: 200,
        message: "conversation removed successfully"
      });
    } else if (!resp) {
      console.log("no such conversation exists");
      res.json({
        status: 202,
        message: "no such conversation exists"
      });
    }
  } catch (err) {
    console.log("error while removing conversation", err);
    res.json({
      status: 400,
      message: "error while removing conversation"
    });
  }
});

module.exports = router;
