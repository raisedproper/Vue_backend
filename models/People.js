var mongoose = require('mongoose');

var PeopleSchema = new mongoose.Schema({
  emailAddress: String,
  createdAt: Date,
  updatedAt: Date
})

PeopleSchema.belongsTo('User', {
  as: 'user',
  localField: 'userId'
})

PeopleSchema.belongsTo('User', {
  as: 'friend',
  localField: 'friendId'
})

var PeopleModel = mongoose.model('People', PeopleSchema)

module.exports = PeopleModel