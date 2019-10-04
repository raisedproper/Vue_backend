var mongoose = require('mongoose');

var PointSchema = new mongoose.Schema({
    name: String,
    location: {
        coordinates: {
            type: [Number],
          },
        type: {
            type: String,
            enum: ['Point']
        }
    }
})

var PointModel = mongoose.model('Point', PointSchema)

module.exports = PointModel