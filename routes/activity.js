var express = require("express");
var router = express.Router();
var date = new Date();
var UserModel = require("../models/User");
var ActivityModel = require("../models/Activity");
var PeopleModel = require("../models/People");
var ConversationModel = require("../models/Conversation");
var ConnectionModel = require("../models/Connection");
var moment = require("moment");
var routeAuthentication = require("../middleware/authentication");
var soc = require("./socket");
var mongoose = require("mongoose");
router.use(routeAuthentication);

router.get("/connections/:id", async (req, res) => {
  var { id } = req.params;

  let user = await UserModel.findOne({ _id: id }).populate({
    path: "friends",
    match: { status: "approved" },
    populate: {
      path: "friend",
      model: "User"
    }
  });
  let friendss = [];

  user.friends.sort((a, b) => {
    moment(a.updatedAt).format("MMM Do YY") -
      moment(b.updatedAt).format("MMM Do YY");
  });

  user.friends.map(async friend => {
    console.log("friend", friend);

    let time = moment(friend.updatedAt).format("YYYY-MM-DD HH:mm:ss");
    let obj = {
      id: friend.friend._id,
      profilePicture: friend.friend.profile.profilePicturePath,
      firstName: friend.friend.firstName,
      emailAddress: friend.friend.emailAddress,
      age:  friend.friend.profile.age,
      gender: friend.friend.profile.gender,
      address: friend.friend.profile.address,
      time: time,
    };
    friendss.push(obj);
  });

  let saveConnection = await ConnectionModel.findOne({ userId: id });
  console.log('save',saveConnection) 
  if (saveConnection) {
    let update = await ConnectionModel.findOneAndUpdate(
      { userId: id },
      { $set: { active: friendss } }
    );
    if (update) {
      console.log("connections updated successfully");
    }
  } else {
    let obj = new ConnectionModel({
      userId: id,
      active: friendss,
      createdAt: date,
      updatedAt: date
    });

    let save = await obj.save();
    if (save) {
      console.log("connections saved successfully");
    }
  } 

  res.json({
    status: 200,
    message: "connections fetched sucessfully",
    response: friendss
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
      readMessage: person.chats[0].readMessage,
      sentBysender: sentBySender
    });
  });
  if (AllChats) {
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
      { $set: { "notifications.$[].status": true, updatedAt: date } }
    );
    if (readNotifications) {
      console.log("user read notifications");
    } else {
      console.log("error reading notifications");
    }

    res.send({
      status: 200,
      message: "notifications fetched successfully",
      response: activity.notifications
    });
  } else {
    res.send({
      status: 400,
      message: "no notifications"
    });
  }
});

router.get("/count/:id", async function(req, res) {
  var { id } = req.params;
});

module.exports = router;
