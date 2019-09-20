var mongoose = require('mongoose');

var ChatSchema = new mongoose.Schema({
    message: {
        senderId: Number,
        recieverId: Number,
        message: String,
        isRead: Boolean,
        createdAt: Date,
        updatedAt: Date
    }
})
var ChatModel = mongoose.model('chat',ChatSchema)

module.exports = ChatModel