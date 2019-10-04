var express = require("express");
var router = express.Router();
var ConversationModel = require("../models/Conversation");
var ChatModel = require("../models/Chat");
var routeAuthentication = require("../middleware/authentication");

router.use(routeAuthentication);

async function findConversation(conversationId) {
  let response = await ChatModel.find({ conversationId: conversationId });
  if (response) {
    return response;
  }
}

router.post("/getConversation/:conversationId", async function(req, res) {
  var { conversationId } = req.params;
  let response = await findConversation(conversationId);
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

router.put("/readMessage/:conversationId", async function(req, res) {
  var { conversationId } = req.params;
  let response = await findConversation(conversationId);
  try {
    if (response.length > 0) {
      ChatModel.updateMany(
        { conversationId: conversationId },
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

router.delete("/deleteConversation/:conversationId", async function(req, res) {
  var { conversationId } = req.params;

  let resp = await ConversationModel.findByIdAndRemove(conversationId);

  try {
    if (resp) {
      ChatModel.findOneAndRemove({ conversationId: conversationId }, function(
        err,
        response
      ) {
        if (response) {
          console.log("conversation removed");
          res.json({
            status: 200,
            message: "conversation deleted"
          });
        } else if (err) {
          console.log("error while removing conversation", err);
          res.json({
            status: 400,
            message: "error while removing conversation"
          });
        }
      });
    } else if (!resp) {
      console.log("no such conversation exists");
      res.json({
        status: 404,
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
