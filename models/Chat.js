var mongoose = require('mongoose');

var ChatSchema = new mongoose.Schema({
        messageBody: String,
        ConversationId: String,
        senderId: String,
        recieverId: String,
        createdAt: Date,
        updatedAt: Date
})

var ChatModel = mongoose.model('Chat',ChatSchema)

module.exports = ChatModel