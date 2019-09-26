var mongoose = require('mongoose');

var ChatSchema = new mongoose.Schema({
    message: {
        messageBody: String,
        messageId: Number,
        ConversationId: Number,
        senderId: Number,
        isRead: Boolean,
        createdAt: Date,
        updatedAt: Date
    }
})
var ChatModel = mongoose.model('chat',ChatSchema)

module.exports = ChatModel