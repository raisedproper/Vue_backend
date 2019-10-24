var express = require("express");
var router = express.Router();
var ActivityModel = require("../models/Activity");
var ConnectionModel = require("../models/Connection");
var moment = require("moment");
var routeAuthentication = require("../middleware/authentication");
var getInbox = require("../middleware/inbox");
router.use(routeAuthentication);

router.get("/connections/:id", async (req, res) => {
  var { id } = req.params;
  let friendss = await ConnectionModel.findOne({ userId: id });

  res.json({
    status: 200,
    message: "connections fetched sucessfully",
    response: friendss ? friendss.active : []
  });
});

router.get("/inbox/:id", async function(req, res) {
  var { id } = req.params;

  var AllChats = await getInbox(id);
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
