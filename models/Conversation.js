var mongoose = require('mongoose');

var ConversationSchema = new mongoose.Schema({
        senderId: String,
        recieverId: String,
        createdAt: Date,
        updatedAt: Date
})

ConversationSchema.belongsTo('users', {
    as: 'sender',
    localField: 'sender_id'
  })

  ConversationSchema.belongsTo('users', {
    as: 'reciever',
    localField: 'reciever_id'
  })

  ConversationSchema.belongsTo('chats',{
    as: 'chats',
    localField: 'chat'
  })
  var ConversationModel = mongoose.model('Conversation',ConversationSchema)

module.exports = ConversationModel