var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var FollowModel = require("../models/FollowAccount");
var moment = require("moment");
var notification = require("../middleware/notification").getNotifications;
var getCount = require("../middleware/count");
var routeAuthentication = require("../middleware/authentication");

router.use(routeAuthentication);

module.exports = function(socket, nsp) {
router.post("/followAccount", async function(req, res) {
  var token = req.headers["token"];
  var { followerId, followId, accountType } = req.body;

  let follower = await UserModel.findById(followerId);
  let follow = await UserModel.findById(followId);

  if (follower && follow) {
    let response = await FollowModel.find({
      followerId: follower.id,
      followId: follow.id,
      accountType: accountType
    });

  var followUsername =  follow.profile.socialMediaAccount[accountType].username

    if (response.length == 0) {
      let followObj = new FollowModel({
        followerId: follower.id,
        followId: follow.id,
        accountType: accountType,
        followUsername: followUsername,
        status: "follows",
        token: token,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      followObj.save(async(err, resp) => {
        if (resp) {
          console.log(resp);

        let followedAccounts = await FollowModel.find({
          followerId: follower.id,
          followId: follow.id
        });

        var newSocialMedia = [];
        newSocialMedia = follow.profile.socialMediaAccount;
        newSocialMedia[accountType].username = followUsername;
        newSocialMedia[accountType].link = follow.profile.socialMediaAccount[accountType].link;

        newSocialMedia[accountType][
          `linkedTo${accountType}`
        ] = true;
        if (followedAccounts.length >= 1) {
         
          followedAccounts.map(accnt => {
            newSocialMedia[accnt.accountType].username = follow.profile.socialMediaAccount[accnt.accountType].username;
            newSocialMedia[accnt.accountType].link =
              follow.profile.socialMediaAccount[accnt.accountType].link;

            newSocialMedia[accnt.accountType][
              `linkedTo${accnt.accountType}`
            ] = true;
          });
          console.log("final array", newSocialMedia);
        } else {
          newSocialMedia = follow.profile.socialMediaAccount;
        }

          console.log("final array", newSocialMedia);
       
          let activityObj = {
            firstName: follower.firstName,
            emailAddress: follower.profile.emailAddress,
            profilePicturePath: follower.profile.profilePicturePath,
            address: follower.profile.address,
            type: accountType,
            text: `${follower.firstName} connected with you`,
            time: moment(new Date()).format("LT"),
            status: false
          };
         
          await notification(follow.id,activityObj)

          let count1 = await getCount(follow.id);
          nsp.emit(`/${follow.id}`, {
            id: follow.id,
            count: count1
          });

          let count2 = await getCount(follower.id);
          nsp.emit(`/${follower.id}`, {
            id: follower.id,
            count: count2
          });

          res.json({
            status: 200,
            message: `${follower.firstName} starts following ${followUsername}`,
            response: {firstName: follow.firstName, 
              lastName: follow.lastName,
              age: follow.profile.age,
              phoneNumber: follow.profile.phoneNumber,
              emailAddress: follow.profile.emailAddress,
              address: follow.profile.address,
              profession: follow.profile.profession,
              profilePicturePath: follow.profile.profilePicturePath,
              gender: follow.profile.gender,
              socialMediaAccount: newSocialMedia,
              publicAccount: follow.profile.publicAccount,
              createdAt: follow.profile.createdAt,
              updatedAt: follow.profile.updatedAt,
               followAt: new Date()},
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
      console.log(`${follower.firstName} already follows ${followUsername}`);
      res.json({
        status: 200,
        message: `${follower.firstName} already follows ${followUsername}`
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
    followerId: followId,
    followId: followerId,
    username: username
  });
  if (response) {
      console.log('response',response)
    if (response.status != "approved") {
      let updatedResp = await FollowModel.updateOne(
        { username: username },
        { 'status': "approved", 
        'updatedAt': new Date() },
        {$new: true}
      );

      if (updatedResp) {
        let time =  moment(new Date()).format('LT')
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

return router;
}
