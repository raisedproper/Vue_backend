var ActivityModel = require("../models/Activity");
var ConnectionModel = require("../models/Connection");
var InboxModel = require("../models/Inbox");

module.exports = async function(id) {
  let notification = await ActivityModel.aggregate([
    { $match: { userId: id.toString() } },
    { $unwind: "$notifications" },
    { $match: { "notifications.status": false } }
  ]);
  console.log("notification", notification);
  let notificationCount = notification.length;

  let connection = await ConnectionModel.aggregate([
    { $match: { userId: id.toString() } },
    { $unwind: "$active" },
    { $match: { "active.seen": false } }
  ]);
  console.log("connection", connection);

  let connectionCount = connection.length;

  let inbox = await InboxModel.aggregate([
    { $match: { userId: id.toString() } },
    { $unwind: "$chats" },
    { $match: { "chats.readMessage": false } }
  ]);
  console.log("inbox", inbox);

  let inboxCount = inbox.length;
console.log(notificationCount , connectionCount , inboxCount)
  let totalCount = notificationCount + connectionCount + inboxCount;
  return totalCount;
};
