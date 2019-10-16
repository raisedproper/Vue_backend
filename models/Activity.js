var mongoose = require("mongoose");

var ActivitySchema = new mongoose.Schema({
  userId: String,
  notifications: Array,
  createdAt: Date,
  updatedAt: Date
});

var ActivityModel = mongoose.model("Activity", ActivitySchema);

module.exports = ActivityModel;