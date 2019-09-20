var mongoose = require('mongoose');

var ConversationSchema = new mongoose.Schema({
        senderId: Number,
        recieverId: Number,
        createdAt: Date,
        updatedAt: Date
    
})
var ConversationModel = mongoose.model('conversations',ConversationSchema)
ConversationSchema.belongsTo('users', {
    as: 'sender',
    localField: 'sender_id'
  })

  ConversationSchema.belongsTo('users', {
    as: 'reciever',
    localField: 'reciever_id'
  })

module.exports = ConversationModel