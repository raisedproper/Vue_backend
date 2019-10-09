var mongoose = require('mongoose');

var ChatSchema = new mongoose.Schema({
        messageBody: String,
        conversationId: String,
        senderId: String,
        recieverId: String,
        readMessage: Boolean,
        showToSender: Boolean,
        showToReceiver: Boolean,
        createdAt: Date,
        updatedAt: Date
})

var ChatModel = mongoose.model('Chat',ChatSchema)

module.exports = ChatModel