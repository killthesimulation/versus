const mongoose = require('mongoose');


const VoteSchema = new mongoose.Schema({
    addr: {
        type: String,
        default: ''
    },
    amount: {
        type: Number,
        default: 0
    },
    team: {
        type: String,
        default: ''
    },
    epochId: {
        type: String,
        default: ''
    }
})

const Vote = mongoose.model('Vote', VoteSchema);

module.exports = Vote;


