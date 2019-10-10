var express = require("express");
var router = express.Router();
var PeopleModel = require("../models/People");
var UserModel = require("../models/User");
var routeAuthentication = require("../middleware/authentication");
var mongoose = require("mongoose");

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

  if (user1 && user2) {
    let people = await PeopleModel.findOne({
      user: user1.id,
      friend: user2.id
    });

    if (people) {
      console.log("response", people);
      if (people.status == "pending") {
        res.json({
          status: 202,
          message: "friend request already sent to this persion"
        });
      } else if (people.status == "approved") {
        res.json({
          status: 202,
          message: "already added as a friend"
        });
      }
    } else if (!people) {
      let peopleObj = new PeopleModel({
        user: user1._id,
        friend: user2._id,
        status: "pending",
        token: token,
        createdAt: date,
        updatedAt: date
      });
      console.log("peopleObj", peopleObj);

      let peopleObj2 = new PeopleModel({
        user: user2._id,
        friend: user1._id,
        status: "pending",
        token: token,
        createdAt: date,
        updatedAt: date
      });
      console.log("peopleObj", peopleObj2);
      var response = await peopleObj.save();
      var response2 = await peopleObj2.save();

      if (response && response2) {
        const friend1 = await UserModel.findById(user1.id);
        const friend2 = await UserModel.findById(user2.id);
        if (friend1) {friend1.friends.push(response)};
        await friend1.save();

        if (friend2) {friend2.friends.push(response2)};
        await friend2.save();
        return res.json({
          status: 200,
          message: "friend request sent successfully"
        });
      } else {
        console.log("friend request didn't sent");
        return res.json({
          status: 400,
          message: "friend request didn't sent"
        });
      }
    }
  } else {
    console.log("These users doesn't exist");
    return res.json({
      status: 404,
      message: "These users doesn't exist"
    });
  }
});

router.put("/acceptfriend",async function(req, res) {
  const friendId = req.body.friendId;
  const userId = req.body.userId;

  let filter = { friend: userId, user: friendId };
  let filter2 = { user: userId, friend: friendId };

 let response =await PeopleModel.findOne({ friend: userId, user: friendId })
 let response2 =await PeopleModel.findOne({ user: userId, friend: friendId })

    if (response && response2) {
      console.log("user found", response);
      if (response.status != "approved") {
      var update = await PeopleModel.update(filter,{ $set: { status: "approved", updatedAt: date } },{ new: true })
            console.log("update1", update);

            var update2 =await PeopleModel.update(filter2,  { $set: { status: "approved", updatedAt: date } },{ new: true })
            console.log('update2',update2)
            
             if (update.nModified != 0 && update2.nModified != 0) {
              console.log("friend request accepted", response);
              return res.json({
                status: 200,
                message: "friend request accepted"
              });
            } else {
               res.json({
                status: 400,
                message: "error while accepting friend request"
              });
            } 

         
      } else if (response.status == "approved" && response2.status == "approved") {
        return res.json({
          status: 202,
          message: "Already added as friend"
        });
      }
    } else if (!response || !response2) {
      console.log("no user found", response);
      return res.json({
        status: 203,
        message: "Kindly send friend request to approve"
      });
    } 
});

router.put("/removeFriend/:id", async function(req, res) {
  const friendId = req.params.id;
  var token = req.headers["token"];

  let response = PeopleModel.findOneAndRemove({ friend: friendId });

  try {
    if (response) {
      let user = await UserModel.findOne({ token: token });
      console.log("user", user);
      const friend = await UserModel.findById(friendId);
      const people = await PeopleModel.findOne({
        user: user.id,
        friend: friendId
      });

      if (user && friend) {
        let update1 = await UserModel.findOneAndUpdate(
          { _id: user._id },
          { $pullAll: { friends: [mongoose.Types.ObjectId(people._id)] } },
          { new: true }
        );
        let update2 = await UserModel.findOneAndUpdate(
          { _id: friendId },
          { $pullAll: { friends: [mongoose.Types.ObjectId(people._id)] } },
          { new: true }
        );
        console.log("update1", update1, "update2", update2);
        if (update1.emailAddress && update2.emailAddress) {
          console.log("friend connections removed");
          return res.json({
            status: 200,
            message: "friend connection removed"
          });
        } else {
          console.log("friend connection not removed");
          return res.json({
            status: 400,
            message: "friend connection not removed"
          });
        }
      }
    }
  } catch (err) {
    console.log("This friend doesnot exist", err);
    res.json({
      status: 404,
      message: "This friend doesnot exist"
    });
  }
});

module.exports = router;
