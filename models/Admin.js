var mongoose = require("mongoose");

var AdminSchema = new mongoose.Schema({
    emailAddress: String,
    password: String,
    name: String,
    token: String,
    resetToken: String,
    resetTime: Number,
    createdAt: Date,
    updatedAt: Date
  });

var AdminModel = mongoose.model("Admin", AdminSchema);

module.exports = AdminModel;
