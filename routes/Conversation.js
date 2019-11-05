var express = require("express");
var router = express.Router();
var ChatModel = require("../models/Chat");
var routeAuthentication = require("../middleware/authentication");
var getCount = require("../middleware/count");
var InboxModel = require("../models/Inbox");
var mongoose = require("mongoose");

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

async function readInbox(sender, reciever) {
  let readInbox = await InboxModel.findOne({
    userId: sender
  });

  if (readInbox) {
    let updateInbox = readInbox.chats.map(obj => {
      if (obj.recieverId == reciever) {
        obj.readMessage = true;
        return obj;
      }
    });
    let updated = await InboxModel.findOneAndUpdate(
      { userId: sender },
      {
        $set: { chats: updateInbox }
      },
      { $new: true }
    );
    console.log("inbox read", updated);
  }
}

module.exports = function(socket, nsp) {
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

        let inbox1 = await readInbox(senderId, recieverId);

        let count1 = await getCount(senderId);
        nsp.emit(`/${senderId}`, {
          id: senderId,
          count: count1
        });

        let count2 = await getCount(recieverId);
        nsp.emit(`/${recieverId}`, {
          id: recieverId,
          count: count2
        });
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
        let inbox = await InboxModel.findOneAndUpdate(
          { userId: senderId },
          {
            $pull: {
              chats: {
                recieverId: mongoose.Types.ObjectId(recieverId)
              }
            },
          },{new: true}
        );
        if (inbox) {
          console.log("conversation deleted from inbox",inbox);

          let count1 = await getCount(senderId);
          nsp.emit(`/${senderId}`, {
            id: senderId,
            count: count1
          });
  
          let count2 = await getCount(recieverId);
          nsp.emit(`/${recieverId}`, {
            id: recieverId,
            count: count2
          });
        }
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

  return router;
};
