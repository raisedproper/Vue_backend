var mongoose = require("mongoose");
const Schema = mongoose.Schema;
var mongoosePaginate = require("mongoose-paginate");

var userlocationSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  location: {
    coordinates: {
      type: [Number],
    },
    type: {
      type: String,
      enum: ["Point"]
    }
  },
  createdAt: Date,
  updatedAt: Date,
});

userlocationSchema.plugin(mongoosePaginate);
userlocationSchema.index({ location: "2dsphere" });
var UserlocationModel = mongoose.model("Userlocation", userlocationSchema);

module.exports = UserlocationModel;
