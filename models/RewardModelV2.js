const mongoose = require('mongoose');


const RewardV2Schema = new mongoose.Schema({
    addr: {
        type: String,
        default: ''
    },
    amount: {
        type: Number,
        default: 0
    },
    coin: {
        type: String,
        default: ''
    },
    team: {
        type: String,
        default: ''
    },
    epochNumber: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
})

const RewardV2 = mongoose.model('RewardV2', RewardV2Schema);

module.exports = RewardV2;