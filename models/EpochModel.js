const mongoose = require('mongoose');


const EpochSchema = new mongoose.Schema({
    redTeamTotal: {
        type: Number,
        default: 0
    },
    blueTeamTotal: {
        type: Number,
        default: 0
    },
    votes: {
        type: Array,
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
})

const Epoch = mongoose.model('Epoch', EpochSchema);

module.exports = Epoch;