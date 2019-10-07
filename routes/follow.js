var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var FollowModel = require("../models/FollowAccount");
var date = new Date();
var moment = require("moment");

router.post("/followAccount", async function(req, res) {
  var token = req.headers["token"];
  var { followerId, followId, accountType, username } = req.body;

  let follower = await UserModel.findById(followerId);
  let follow = await UserModel.findById(followId);

  if (follower && follow) {
    let response = await FollowModel.find({
      followerId: follower.id,
      followId: follow.id,
      accountType: accountType
    });

    if (response.length == 0) {
      let followObj = new FollowModel({
        followerId: follower.id,
        followId: follow.id,
        accountType: accountType,
        username: username,
        status: "pending",
        token: token,
        createdAt: date,
        updatedAt: date
      });

      followObj.save((err, resp) => {
        if (resp) {
          console.log(resp);
          res.json({
            status: 200,
            message: "follow request sent successfully"
          });
        } else if (err) {
          console.log(err);
          res.json({
            status: 400,
            message: `error while sending follow request`
          });
        }
      });
    } else if (response.length != 0) {
      console.log("follow request aleady sent to this account");
      res.json({
        status: 200,
        message: "follow request aleady sent to this account"
      });
    }
  } else {
    console.log("These users doesn't exist");
    res.json({
      status: 404,
      message: "These users doesn't exist"
    });
  }
});

router.put("/acceptFollowAccount", async function(req, res) {
  var { followerId, followId, username } = req.body;

  let response = await FollowModel.findOne({
    followerId: followerId,
    followId: followId,
    username: username
  });
  if (response) {
      console.log('response',response)
    if (response.status != "approved") {
      let updatedResp = await FollowModel.updateOne(
        { username: username },
        { 'status': "approved", 
        'updatedAt': date },
        {$new: true}
      );

      if (updatedResp) {
        let time =  moment(date).format('LT')
        var obj = {
            followerId: response.followerId,
            followId: response.followId,
            username: response.username,
            time: time
          };
        console.log("follow request accepted");
        res.json({
          status: 200,
          message: "follow request accepted",
          response: obj
        });
      } else {
        console.log("follow request not accepted");
        res.json({
          status: 200,
          message: "follow request not accepted",
          response: obj
        });
      }
    } else if (response.status == "approved") {
        let time =  moment(response.updatedAt).format('LT')
        var obj = {
            followerId: response.followerId,
            followId: response.followId,
            username: response.username,
            time: time
          };
      res.json({
        status: 202,
        message: "Already followed",
        response: obj
      });
    }
  } else if (!response) {
    console.log("no user found", response);
    res.json({
      status: 203,
      message: "Kindly send follow request to approve"
    });
  }
});

module.exports = router;
