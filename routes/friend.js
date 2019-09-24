var express = require("express");
var router = express.Router();
var PeopleModel = require("../models/People");
var UserModel = require("../models/User");
const jwt = require("jsonwebtoken");
const config = require("../config");

var date = new Date();
// router.get('/', function(req, res) {

// })

// router.get('/:id', function(req, res) {

// })

router.post("/createFriend", async function(req, res) {
  const userId = req.body.userId;
  const friendId = req.body.friendId;
  /* var token = req.headers["token"]; */

 /*  if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  } */

  let user1 = await UserModel.findById(userId);
  console.log("user1", user1);
  let user2 = await UserModel.findById(friendId);
  console.log("user2", user2);

 /*  jwt.verify(token, config.loginSecret, function(err, decoded) {
    if (err) {
      return res.status(500).send({
        authorization: false,
        message: "Failed to authenticate token."
      });
    } else { */
      PeopleModel.find({ userId: user1.id, friendId: user2.id }, function(
        err,
        people
      ) {
        if (people) {
          console.log("response", people);
          res.json({
            status: 200,
            message: "friend request already sent to this persion"
          });
        } else if (!people) {
          let people = new PeopleModel({
            user: user1,
            friend: user2,
            status: "pending",
            createdAt: date,
            updatedAt: date
          });
          console.log("people", people);
          people.save((resp, err) => {
            if (resp) {
              console.log(res);
              res.json({
                status: 200,
                message: "friend request sent successfully"
              });
            } else if(err){
              console.log(err);
              res.json({
                status: 400,
                message: `error while sending friend request`
              });
            }
          });
        }
      });
   /*  }
  }); */
});

router.put("/acceptfriend/:id", function(req, res) {
  console.log("here",req.params);
  const  friendId  = req.params.id;
  const userId = "5d89b2d00e4e1f55d6ba3e41";
  console.log(friendId, userId);
  let filter = { userId: userId};
  let update = { status: "approved" };
  console.log("here", filter, update);
/*   var token = req.headers["token"]; */

/*   if (!token) {
    return res
      .status(401)
      .send({ authorization: false, message: "No token provided." });
  } */

      PeopleModel.findOneAndUpdate(filter, update, function(resp, err) {
        console.log('user found',resp)
        if (resp) {
          res.json({
            status: 200,
            message: "friend request accepted"
          });
        } else if (!resp) {
          res.json({
            status: 200,
            message: "Kindly send friend request to approve"
          });
        } else if (err) {
          res.json({
            status: 400,
            message: "error while accepting friend request"
          });
        }
      });
   
});

// router.delete('/:id', function(req, res) {

// })

module.exports = router;
