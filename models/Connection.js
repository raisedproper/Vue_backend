var mongoose = require("mongoose");

var ConnectionSchema = new mongoose.Schema({
  userId: String,
  active: Array,
  createdAt: Date,
  updatedAt: Date
});

var ConnectionModel = mongoose.model("Connection", ConnectionSchema);

module.exports = ConnectionModel;