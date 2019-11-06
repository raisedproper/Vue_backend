var express = require("express");
var router = express.Router();
var ActivityModel = require("../models/Activity");
var ConnectionModel = require("../models/Connection");
var routeAuthentication = require("../middleware/authentication");
var getInbox = require("../middleware/inbox");
var getCount = require("../middleware/count");
router.use(routeAuthentication);

module.exports = function(socket, nsp) {
  router.get("/connections/:id", async (req, res) => {
    try {
    var { id } = req.params;
    let friendss = await ConnectionModel.findOne({ userId: id });

      if (friendss) {
        let updateSeen = friendss.active.map(friend => {
          friend.seen = true;
          return friend;
        });
        let seenConnections = await ConnectionModel.updateOne(
          { userId: id },
          {
            $set: { active: updateSeen }
          }
        );
        if (seenConnections) {
          console.log("connections seen by user");
        }
      }
      let count1 = await getCount(id);
      nsp.emit(`/${id}`, {
        id: id,
        count: count1
      });

      res.json({
        status: 200,
        message: "connections fetched sucessfully",
        response: friendss ? friendss.active : []
      });
    } catch (err) {
      console.log("error fetching connections");
      res.json({
        status: 400,
        message: "error fetching connections"
      });
    }
  });

  router.get("/inbox/:id", async function(req, res) {
    try {
    var { id } = req.params;
    var AllChats = await getInbox(id);
      if (AllChats) {
        let count1 = await getCount(id);
        nsp.emit(`/${id}`, {
          id: id,
          count: count1
        });

        res.json({
          status: 200,
          message: "inbox fetched successfully",
          response: AllChats
        });
      }
    } catch (err) {
      console.log("error in fetching inbox", err);
      res.json({
        status: 400,
        message: "error in fetching inbox"
      });
    }
  });

  router.get("/notifications/:id", async function(req, res) {
    try {
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
        let count1 = await getCount(id);
        nsp.emit(`/${id}`, {
          id: id,
          count: count1
        });
        res.json({
          status: 200,
          message: "notifications fetched successfully",
          response: activity.notifications
        });
      } else {
        res.json({
          status: 400,
          message: "There are no activities!"
        });
      }
    } catch (err) {
      console.log("error while fetching notifications", err);
      res.json({
        status: 400,
        message: "error while fetching notifications"
      });
    }
  });

  return router;
};
