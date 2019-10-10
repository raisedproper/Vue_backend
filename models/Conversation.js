var mongoose = require("mongoose");
const Schema = mongoose.Schema;

var ConversationSchema = new mongoose.Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },
  recieverId: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
});

var ConversationModel = mongoose.model("Conversation", ConversationSchema);

module.exports = ConversationModel;
