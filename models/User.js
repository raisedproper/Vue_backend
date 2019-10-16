var mongoose = require('mongoose');
const Schema = mongoose.Schema;
var userSchema = new mongoose.Schema({
        emailAddress: String,
        password: String,
        firstName: String,
        lastName: String,
        token: String,
        createdAt: Date,
        updatedAt: Date,
        friends: [{ type: Schema.Types.ObjectId, ref: 'People' }],

 profile: {
    age: Number,
    phoneNumber: Number,
    emailAddress: String,
    address: String,
    profession: String,
    profilePicturePath: String,
    gender: String,
    socialMediaAccount: Object,
    publicAccount: Boolean,
    createdAt: Date,
    updatedAt: Date
},

location: {
    coordinates: {
        type: [Number],  
  index: { type: '2dsphere', sparse: false },
      },
    type: {
        type: String,
        enum: ['Point']
    }
},
})


userSchema.hasMany('People')
userSchema.index({location: '2dsphere'});
var UserModel = mongoose.model('User',userSchema);

module.exports = UserModel

