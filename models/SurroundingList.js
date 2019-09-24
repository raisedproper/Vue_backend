var mongoose = require('mongoose');

var surroundingListSchema = new mongoose.Schema({
        emailAddress: String,
        password: String,
        firstName: String,
        lastName: String,
        token: String,
        isVerified: Number,
        createdAt: Date,
        updatedAt: Date,

 profile: {
    age: Number,
    location: String,
    phoneNumber: Number,
    emailAddress: String,
    profession: String,
    profilePicture: {data: Buffer,contentType: String},
    gender: String,
    socialMediaAccount: Array,
    publicAccount: Boolean,
    createdAt: Date,
    updatedAt: Date
}
})

var surroundingListModel = mongoose.model('surroundingList',surroundingListSchema);

module.exports = surroundingListModel