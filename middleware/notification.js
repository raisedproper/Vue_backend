var ActivityModel = require("../models/Activity");
var ConnectionModel = require("../models/Connection");
var ChatModel = require("../models/Connection");

var moment = require("moment");

var soc;
var nspp;
module.exports = {
  start: function(socket, nsp) {
    (soc = socket), (nspp = nsp);
  },

  getNotifications: async function(id, activityObj) {
    console.log("id", id);
    let notification = await ActivityModel.findOne({ userId: id });

    var notArray = [];
    var multipleView = false;
    if (notification) {
      notification.notifications.map(async obj => {
        if (
          obj.type == "view" &&
          activityObj.type == "view" &&
          activityObj.emailAddress == obj.emailAddress
        ) {
          multipleView = true;
          updateNotification(id, activityObj);
        } else if (
          obj.type != "view" &&
          activityObj.type != "view" &&
          activityObj.emailAddress != obj.emailAddress
        ) {
          multipleView = false;
        } else if (
          obj.type == "message" &&
          activityObj.type == "message" &&
          activityObj.emailAddress == obj.emailAddress
        ) {
          multipleView = true;
          updateNotification(id, activityObj);
        } else if (
          obj.type != "message" &&
          activityObj.type != "message" &&
          activityObj.emailAddress != obj.emailAddress
        ) {
          multipleView = false;
        }
      });
      if (!multipleView) {
        console.log("else called", activityObj);
        notification.notifications.push(activityObj);
      }
      await notification.save();
      console.log("notification saved");
      console.log("s", id);
      let count = await getCount(id);
      console.log("count", count);
      nspp.emit("count", count);
    } else {
      notArray.push(activityObj);

      let notify = new ActivityModel({
        userId: id,
        notifications: notArray,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      let result = await notify.save();
      if (result) {
        console.log("notification saved");
        console.log("s", id);
        let count = await getCount(id);
        console.log("count", count);
        nspp.emit("count", count);
      } else {
        console.log("notification not saved");
      }
    }
  }
};

async function updateNotification(id, activityObj) {
  let find = await ActivityModel.findOne({ userId: id });
  if (find) {
    let notifications = await find.notifications.map(notification => {
      if (
        notification.type == "view" &&
        notification.emailAddress == activityObj.emailAddress
      ) {
        console.log("get time", activityObj.time);
        notification.time = activityObj.time;
        notification.status = false;
      }
      return notification;
    });
    console.log("notifications", notifications);
    let updated = await ActivityModel.updateOne(
      {
        userId: id
      },
      { $set: { notifications: notifications } }
    );
    console.log("updated", updated);
  }
}

async function getCount(id) {
  let notification = await ActivityModel.aggregate([
    { $match: { userId: id } },
    { $unwind: "$notifications" },
    { $match: { "notifications.status": false } }
  ]);

  let notificationCount = notification.length;
  console.log(notification);
  let connection = await ConnectionModel.aggregate([
    { $match: { userId: id } },
    { $unwind: "$active" },
    { $match: { "active.seen": false } }
  ]);

  let connectionCount = connection.length;
  console.log(connectionCount);
  let inbox = await ChatModel.aggregate([
    { $match: { recieverId: id}},
    { $match: { readMessage: false } }
  ]);
console.log('inbox',inbox)
  let inboxCount = inbox.length;
  console.log("i", inboxCount);
  let totalCount = notificationCount + connectionCount + inboxCount;
  return totalCount;
}
