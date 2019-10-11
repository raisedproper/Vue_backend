var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ChatSchema = new mongoose.Schema({
        messageBody: String,
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
        senderId: { type: Schema.Types.ObjectId, ref: 'User' },
        recieverId: { type: Schema.Types.ObjectId, ref: 'User' },
        readMessage: Boolean,
        showToSender: Boolean,
        showToReceiver: Boolean,
        createdAt: Date,
        updatedAt: Date
})

var ChatModel = mongoose.model('Chat',ChatSchema)

module.exports = ChatModel