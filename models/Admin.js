var mongoose = require("mongoose");

var AdminSchema = new mongoose.Schema({
    emailAddress: String,
    password: String,
    name: String,
    resetToken: String,
    resetTime: Date,
    createdAt: Date,
    updatedAt: Date
  });

var AdminModel = mongoose.model("Admin", AdminSchema);

module.exports = AdminModel;
