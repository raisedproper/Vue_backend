var mongoose = require('mongoose');

var FollowSchema = new mongoose.Schema({
    status: String,
    token: String,
    accountType: String,
    followerUsername: String,
    followUsername: String,
    createdAt: Date,
    updatedAt: Date
})

FollowSchema.belongsTo('User', {
    as: 'follower',
    localField: 'followerId'
  })
  
FollowSchema.belongsTo('User', {
    as: 'follow',
    localField: 'followId'
})

var FollowModel = mongoose.model('Follow', FollowSchema)

module.exports = FollowModel