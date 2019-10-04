var express = require("express");
var router = express.Router();
var PeopleModel = require("../models/People");
var UserModel = require("../models/User");
var routeAuthentication = require("../middleware/authentication");

var date = new Date();
router.use(routeAuthentication);

router.post("/createFriend", async function(req, res) {
  var token = req.headers["token"];
  const userId = req.body.userId;
  const friendId = req.body.friendId;

  let user1 = await UserModel.findById(userId);
  console.log("user1", user1);
  let user2 = await UserModel.findById(friendId);
  console.log("user2", user2);

  if(user1 && user2){
    console.log("user1", user1.id);
    console.log("user2", user2.id);
    PeopleModel.find({ userId: user1.id, friendId: user2.id }, function(
      err,
      people
    ) {
      if (people.length != 0) {
        console.log("response", people);
        res.json({
          status: 202,
          message: "friend request already sent to this persion"
        });
      } else if (people.length == 0) {
        console.log("hggh");
        let peopleObj = new PeopleModel({
          user: user1,
          friend: user2,
          status: "pending",
          token: token,
          createdAt: date,
          updatedAt: date
        });
        console.log("peopleObj", peopleObj);
        peopleObj.save((err, response) => {
          if (response) {
            console.log(res);
            res.json({
              status: 200,
              message: "friend request sent successfully"
            });
          } else if (err) {
            console.log(err);
            res.json({
              status: 400,
              message: `error while sending friend request`
            });
          }
        });
      } else if (err) {
        console.log("error while finding people", err);
        res.json({
          status: 400,
          message: `error while sending friend request`
        });
      }
    });
  } else {
    console.log("These users doesn't exist");
        res.json({
          status: 404,
          message: "These users doesn't exist"
        });
  }
});

router.put("/acceptfriend", function(req, res) {
  const friendId = req.body.friendId;
  const userId = req.body.userId;

  let filter = { userId: userId };
  let update = { status: "approved" };

  PeopleModel.findOne({ userId: userId, friendId: friendId }, function(
    err,
    response
  ) {
    if (response) {
      console.log("user found", response);
      if (response.status != "approved") {
        PeopleModel.updateOne(filter, { $set: update }, function(err, update) {
          if (update) {
            console.log("friend request accepted", response);
            res.json({
              status: 200,
              message: "friend request accepted"
            });
          } else if (err) {
            res.json({
              status: 400,
              message: "error while accepting friend request"
            });
          }
        });
      } else if (response.status == "approved") {
        res.json({
          status: 202,
          message: "Already added as friend"
        });
      }
    } else if (!response) {
      console.log("no user found", response);
      res.json({
        status: 203,
        message: "Kindly send friend request to approve"
      });
    } else if (err) {
      console.log("error while accepting friend request", err);
      res.json({
        status: 400,
        message: "error while accepting friend request"
      });
    }
  });
});

router.delete("/removeFriend/:id", function(req, res) {
  const friendId = req.params.id;

  PeopleModel.findOneAndRemove({friendId: friendId}, function(err, response) {
    if (response) {
      console.log("friend connections removed");
      res.json({
        status: 200,
        message: "friend connection removed"
      })
    } else if (err) {
      console.log("error while removing friend", err);
      res.json({
        status: 400,
        message: "error while removing friend connection"
      })
    }
  });
});

module.exports = router;
