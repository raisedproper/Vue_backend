var express = require("express");
var router = express.Router();
var date = new Date();
var ActivityModel = require("../models/Activity");
var InboxModel = require("../models/Inbox");
var ConversationModel = require("../models/Conversation");
var ConnectionModel = require("../models/Connection");
var moment = require("moment");
var routeAuthentication = require("../middleware/authentication");
router.use(routeAuthentication);

router.get("/connections/:id", async (req, res) => {
  var { id } = req.params;
 let friendss = await ConnectionModel.findOne({userId: id});

  res.json({
    status: 200,
    message: "connections fetched sucessfully",
    response: (friendss) ? friendss.active : []
  });
});

router.get("/inbox/:id", async function(req, res) {
  var { id } = req.params;

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
      readMessage: sentBySender == true ? true :person.chats[0].readMessage ,
      sentBysender: sentBySender
    });
  });
  if (AllChats) {
    let checkInbox = await InboxModel.findOne({ userId: id });
    if (checkInbox) {
      let updateIndex = InboxModel.findOneAndUpdate(
        { userId: id },
        { $set: { chats: AllChats } },
        { new: true }
      );
      if (updateIndex) {
        console.log("chats updated");
      }
    } else {
      var createInbox = new InboxModel({
        userId: id,
        chats: AllChats,
        createdAt: date,
        updatedAt: date
      });

      let saveInbox = await createInbox.save();
      if (saveInbox) {
        console.log("inbox saved");
      }
    }

    res.json({
      status: 200,
      message: "inbox fetched successfully",
      response: AllChats
    });
  } else {
    res.json({
      status: 400,
      message: "error in fetching inbox"
    });
  }
});

router.get("/notifications/:id", async function(req, res) {
  var { id } = req.params;

  let activity = await ActivityModel.findOne({ userId: id });

  if (activity) {
    let readNotifications = await ActivityModel.updateMany(
      {
        userId: id
      },
      { $set: { "notifications.$[].status": true } },
      { new: true }
    );
    if (readNotifications) {
      console.log("user read notifications");
    } else {
      console.log("error reading notifications");
    }

    res.json({
      status: 200,
      message: "notifications fetched successfully",
      response: activity.notifications
    });
  } else {
    res.json({
      status: 400,
      message: "no notifications"
    });
  }
});

module.exports = router;
