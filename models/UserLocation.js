var mongoose = require('mongoose');
const Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var userLocationSchema = new mongoose.Schema({
    emailAddress: String,
    userId: String,
    latitude: String,
    longitude: String,
    distance: String,
    status: String,
    createdAt: Date,
    updatedAt: Date,  
  });
  userLocationSchema.plugin(mongoosePaginate)
var UserLocationModel = mongoose.model("UserLocation", userLocationSchema);

module.exports = UserLocationModel;