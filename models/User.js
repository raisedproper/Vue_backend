var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
        emailAddress: String,
        password: String,
        firstName: String,
        lastName: String,
        token: String,
        createdAt: Date,
        updatedAt: Date,

 profile: {
    age: Number,
    location: String,
    phoneNumber: Number,
    emailAddress: String,
    profession: String,
    profilePicturePath: String,
    gender: String,
    socialMediaAccount: Array,
    publicAccount: Boolean,
    createdAt: Date,
    updatedAt: Date
}
})

userSchema.hasMany('People')

var UserModel = mongoose.model('User',userSchema);

module.exports = UserModel

