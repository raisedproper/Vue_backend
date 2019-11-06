var express = require("express");
var router = express.Router();
var PeopleModel = require("../models/People");
var UserModel = require("../models/User");
var routeAuthentication = require("../middleware/authentication");
var mongoose = require("mongoose");
var moment = require("moment");
var notification = require("../middleware/notification").getNotifications;
var ActivityModel = require("../models/Activity");
var ConnectionModel = require("../models/Connection");
var getCount = require("../middleware/count");
router.use(routeAuthentication);

module.exports = function(socket, nsp) {
  router.post("/createFriend", async function(req, res) {
    try {
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
            createdAt: new Date(),
            updatedAt: new Date()
          });

          let peopleObj2 = new PeopleModel({
            user: user2._id,
            friend: user1._id,
            status: "pending",
            token: token,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          var response = await peopleObj.save();
          var response2 = await peopleObj2.save();

          if (response && response2) {
            const friend1 = await UserModel.findById(user1.id);
            const friend2 = await UserModel.findById(user2.id);
            if (friend1) {
              friend1.friends.push(response);
            }
            await friend1.save();

            if (friend2) {
              friend2.friends.push(response2);
            }
            await friend2.save();

            let activityObj = {
              firstName: friend1.firstName,
              profilePicturePath: friend1.profile.profilePicturePath,
              emailAddress: friend1.profile.emailAddress,
              address: friend1.profile.address,
              type: "friendRequest",
              text: `${friend1.firstName} wants to connect`,
              time: moment(new Date()).format("LT"),
              id: friend1.id,
              status: false
            };

            await notification(friend2.id, activityObj);

            let count1 = await getCount(friend1.id);
            nsp.emit(`/${friend1.id}`, {
              id: friend1.id,
              count: count1
            });

            let count2 = await getCount(friend2.id);
            nsp.emit(`/${friend2.id}`, {
              id: friend2.id,
              count: count2
            });

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
    } catch (err) {
      console.log("error creating friend", err);
      return res.json({
        status: 404,
        message: "error creating friend"
      });
    }
  });

  router.put("/acceptfriend", async function(req, res) {
    try {
    const friendId = req.body.friendId;
    const userId = req.body.userId;

    let filter = { friend: userId, user: friendId };
    let filter2 = { user: userId, friend: friendId };

    let response = await PeopleModel.findOne({
      friend: userId,
      user: friendId
    });
    let response2 = await PeopleModel.findOne({
      user: userId,
      friend: friendId
    });

      if (response && response2) {
        console.log("user found", response);
        if (response.status != "approved") {
          var update = await PeopleModel.update(
            filter,
            { $set: { status: "approved", updatedAt: new Date() } },
            { new: true }
          );

          var update2 = await PeopleModel.update(
            filter2,
            { $set: { status: "approved", updatedAt: new Date() } },
            { new: true }
          );

          if (update.nModified != 0 && update2.nModified != 0) {
            console.log("friend request accepted", response);
            let connection = await UserModel.findById(userId);
            let getFriend = await UserModel.findById(friendId);
            console.log("email", getFriend.emailAddress);

            let getNotification = await ActivityModel.findOneAndUpdate(
              { userId: userId },
              {
                $pull: {
                  notifications: {
                    emailAddress: getFriend.emailAddress,
                    type: "friendRequest"
                  }
                }
              },
              { new: true }
            );
            console.log("getNotification", getNotification);
            if (getNotification) {
              console.log("notification removed");
            }
            if (connection) {
              let activityObj = {
                firstName: connection.firstName,
                profilePicturePath: connection.profile.profilePicturePath,
                emailAddress: connection.profile.emailAddress,
                type: "connection",
                text: `${connection.firstName} accepted connection`,
                address: connection.profile.address,
                time: moment(new Date()).format("LT"),
                status: false
              };
              await notification(friendId, activityObj);

              let adduserFriend = await getFriends(userId);
              let addfriendUser = await getFriends(friendId);

              let count1 = await getCount(friendId);
              console.log("check1", count1);
              nsp.emit(`/${friendId}`, {
                id: friendId,
                count: count1
              });

              let count2 = await getCount(userId);
              console.log("check2", count2);
              nsp.emit(`/${userId}`, {
                id: userId,
                count: count2
              });
            }

            return res.json({
              status: 200,
              message: "friend request accepted",
              respone: getNotification
            });
          } else {
            res.json({
              status: 400,
              message: "error while accepting friend request"
            });
          }
        } else if (
          response.status == "approved" &&
          response2.status == "approved"
        ) {
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
    } catch (err) {
      console.log("error accepting friend request", err);
      return res.json({
        status: 404,
        message: "error accepting friend request"
      });
    }
  });

  router.put("/removeFriend/:id", async function(req, res) {
    try {
    const friendId = req.params.id;
    var token = req.headers["token"];

    let user = await UserModel.findOne({ token: token });
    let friend = await UserModel.findOne({ id: friendId });

      if (user) {
        let response = await PeopleModel.findOneAndRemove({
          user: user.id,
          friend: friendId
        });

        let response2 = await PeopleModel.findOneAndRemove({
          user: friendId,
          friend: user.id
        });

        if (response && response2) {
          let update1 = await UserModel.findOneAndUpdate(
            { _id: user.id },
            { $pullAll: { friends: [mongoose.Types.ObjectId(response._id)] } },
            { new: true }
          );

          let update2 = await UserModel.findOneAndUpdate(
            { _id: friendId },
            { $pullAll: { friends: [mongoose.Types.ObjectId(response2._id)] } },
            { new: true }
          );

          if (response.status == "approved" && response2.status == "approved") {
            if (update1.emailAddress && update2.emailAddress) {
              let remove = await ConnectionModel.findOneAndUpdate(
                { userId: user.id },
                {
                  $pull: {
                    active: { emailAddress: update2.emailAddress }
                  }
                },
                { new: true }
              );
              let remove2 = await ConnectionModel.findOneAndUpdate(
                { userId: friendId },
                {
                  $pull: {
                    active: { emailAddress: update1.emailAddress }
                  }
                },
                { new: true }
              );
              console.log("connection removed");
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
          } else if (
            response.status == "pending" &&
            response2.status == "pending"
          ) {
            if (update1.emailAddress && update2.emailAddress) {
              let getNotification = await ActivityModel.findOneAndUpdate(
                { userId: user.id },
                {
                  $pull: {
                    notifications: {
                      emailAddress: update2.emailAddress,
                      type: "friendRequest"
                    }
                  }
                },
                { new: true }
              );

              if (getNotification) {
                console.log("notification removed");
              }

              console.log("friend request rejected successfully");
              return res.json({
                status: 200,
                message: "friend request rejected successfully",
                response: getNotification.notifications
              });
            } else {
              console.log("friend request not rejected");
              return res.json({
                status: 400,
                message: "friend request not rejected"
              });
            }
          }
        }
      } else {
        console.log("This friend doesnot exist");
        res.json({
          status: 404,
          message: "This friend doesnot exist"
        });
      }
    } catch (err) {
      console.log("error finding friend request", err);
      res.json({
        status: 404,
        message: "error finding friend request"
      });
    }
  });

  async function getFriends(id) {
    var friendExists;
    friendExists = false;
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

    let saveConnection = await ConnectionModel.findOne({ userId: id });

    user.friends.map(async friend => {
      console.log("friend address", friend.friend.emailAddress);

      if (saveConnection) {
        let check = saveConnection.active
          .map(saved => saved.emailAddress)
          .includes(friend.friend.emailAddress);
        if (check == true) {
          friendExists = true;
        } else {
          friendExists = false;
        }
      }
      let time = moment(friend.updatedAt).format("YYYY-MM-DD HH:mm:ss");
      let obj = {
        id: friend.friend._id,
        profilePicture: friend.friend.profile.profilePicturePath,
        firstName: friend.friend.firstName,
        emailAddress: friend.friend.emailAddress,
        age: friend.friend.profile.age,
        gender: friend.friend.profile.gender,
        address: friend.friend.profile.address,
        seen: friendExists,
        time: time
      };
      friendss.push(obj);
    });

    console.log("save", saveConnection);
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
        createdAt: new Date(),
        updatedAt: new Date()
      });

      let save = await obj.save();

      if (save) {
        console.log("connections saved successfully");
      }
      return save;
    }
  }

  return router;
};
