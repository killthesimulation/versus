const mongoose = require('mongoose');


const EthWalletSchema = new mongoose.Schema({
    bnbAmount: {
        type: Number,
        default: 0
    },
    versusAmount: {
        type: Number,
        default: 0
    },
    addr: {
        type: String,
        default: ''
    },
    currentVote: {
        type: String,
        default: ''
    },
    totalVoted: {
        type: Number,
        default: 0
    },
    totalEarned: {
        type: Number,
        default: 0
    },
    totalPnl: {
        type: Number,
        default: 0
    },
})

const EthWallet = mongoose.model('EthWallet', EthWalletSchema);

module.exports = EthWallet;