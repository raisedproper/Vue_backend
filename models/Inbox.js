var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var InboxSchema = new mongoose.Schema({
    userId: String,
    chats: Array,
    createdAt: Date,
    updatedAt: Date,
})

var InboxModel = mongoose.model('Inbox', InboxSchema)

module.exports = InboxModel