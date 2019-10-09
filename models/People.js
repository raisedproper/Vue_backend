var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PeopleSchema = new mongoose.Schema({
    status: String,
    token: String,
    createdAt: Date,
    updatedAt: Date,
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    friend: { type: Schema.Types.ObjectId, ref: 'User' }
})

var PeopleModel = mongoose.model('People', PeopleSchema)

module.exports = PeopleModel