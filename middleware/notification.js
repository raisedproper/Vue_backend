var ActivityModel = require("../models/Activity");
var date = new Date();
var moment = require("moment");

module.exports = async function(id, activityObj) {
  let notification = await ActivityModel.findOne({ userId: id });
  console.log('notification',notification)
  var notArray = [];
  var multipleView = false
  if (notification) {
    notification.notifications.map(async obj => {
      if (obj.type == "view" && activityObj.firstName == obj.firstName) { 
        let newTime = moment(date).format("LT");
        multipleView = true
        let updated = await ActivityModel.updateOne(
          { userId: id },
          { $set: { "notifications.$[].time": newTime } }
        );
        if (updated) {
          console.log("notification updated");
        }
      } else {
        multipleView = false
      }
    });
if(!multipleView){
    notification.notifications.push(activityObj);
}
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
};
