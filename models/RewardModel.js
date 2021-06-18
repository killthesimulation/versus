const mongoose = require('mongoose');


const RewardSchema = new mongoose.Schema({
    userId: {
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
    isActive: {
        type: Boolean,
        default: true
    }
})

const Reward = mongoose.model('Reward', RewardSchema);

module.exports = Reward;