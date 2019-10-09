var express = require("express");
var router = express.Router();
var date = new Date();
var UserModel = require("../models/User");
var moment = require("moment");
var routeAuthentication = require("../middleware/authentication");

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

  user.friends.sort((a,b) => { moment(a.updatedAt).format("MMM Do YY") -moment(b.updatedAt).format("MMM Do YY") })

  user.friends.map(friend => {
    let date = moment(friend.updatedAt).format("MMM Do YY");
    let obj = {
      id: friend._id,
      profilePicture: friend.friend.profile.profilePicturePath,
      firstName: friend.friend.firstName,
      address: friend.friend.profile.address,
      date: date
    };
    friendss.push(obj);
  });

  res.json({
    status: 200,
    message: "connections fetched sucessfully",
    response: friendss
  });
});

module.exports = router;
