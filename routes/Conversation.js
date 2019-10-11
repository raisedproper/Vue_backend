var express = require("express");
var router = express.Router();
var ConversationModel = require("../models/Conversation");
var ChatModel = require("../models/Chat");
var routeAuthentication = require("../middleware/authentication");
var moment = require("moment");
var date = new Date();

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
  console.log('sgs',response)
  try {
    if (response.length > 0) {
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

router.put("/readMessage", async function(req, res) {
  var { recieverId, senderId } = req.body;
  let response = await findConversation(recieverId, senderId);
  try {
    if (response.length > 0) {
      ChatModel.updateMany(
        {
          $or: [
            { senderId: senderId, recieverId: recieverId },
            { senderId: recieverId, recieverId: senderId }
          ]
        },
        { $set: { readMessage: true, updatedAt: date } },
        function(err, response) {
          if (response) {
            console.log("messages have been read");
            return res.json({
              status: 200,
              message: "messages have been read"
            });
          } else if (err) {
            console.log("messages not read", err);
            return res.json({
              status: 400,
              message: "messages not read"
            });
          }
        }
      );
    } else if (response.length == 0) {
      console.log("no conversation");
      res.json({
        status: 202,
        message: "no conversation exists"
      });
    }
  } catch (err) {
    console.log("error fetching conversation", err);
    return res.json({
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
        "chats": [],
        "showToSender": showToSender,
        "showToReceiver": showToReceiver,
        "updatedAt": date
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
