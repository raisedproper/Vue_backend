var mongoose = require('mongoose');

var NeighbourSchema = new mongoose.Schema({
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


var NeighbourModel = mongoose.model('Neighbour', NeighbourSchema)

module.exports = NeighbourModel