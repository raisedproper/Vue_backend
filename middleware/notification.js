
var ActivityModel = require('../models/Activity')
var date = new Date();
module.exports =async function(id,activityObj) {
let notification = await ActivityModel.findOne({ userId: id });
var notArray = [];
if (notification) {
  notification.notifications.push(activityObj);
  await notification.save();
  console.log("notification saved");
} else {
  notArray.push(activityObj);

  let notify = new ActivityModel({
    userId: id,
    notifications: notArray,
    createdAt: date,
    updatedAt: date
  });

  let result = await notify.save();
  if (result) {
    console.log("notification saved");
  } else {
    console.log("notification not saved");
  }
}
}