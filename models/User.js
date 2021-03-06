var mongoose = require("mongoose");
const Schema = mongoose.Schema;
var mongoosePaginate = require("mongoose-paginate");

var userSchema = new mongoose.Schema({
  emailAddress: String,
  password: String,
  firstName: String,
  lastName: String,
  token: String,
  status: String,
  fcmToken: String,
  createdAt: Date,
  updatedAt: Date,
  friends: [{ type: Schema.Types.ObjectId, ref: "People" }],

  profile: {
    dob: String,
    age: Number,
    phoneNumber: String,
    emailAddress: String,
    username: String,
    address: String,
    profession: String,
    profilePicturePath: String,
    gender: String,
    socialMediaAccount: Object,
    publicAccount: Boolean,
    createdAt: Date,
    updatedAt: Date
  },

  userLocation:[],
  location: {
    coordinates: {
      type: [Number],
    },
    type: {
      type: String,
      enum: ["Point"]
    }
  }
});

userSchema.plugin(mongoosePaginate);
userSchema.hasMany("People");
userSchema.index({ location: "2dsphere" });
var UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
