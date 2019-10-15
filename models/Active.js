var mongoose = require("mongoose");

var ActiveSchema = new mongoose.Schema({
  userId: String,
  active: Array,
  createdAt: Date,
  updatedAt: Date
});

var ActiveModel = mongoose.model("Active", ActiveSchema);

module.exports = ActiveModel;
