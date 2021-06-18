const mongoose = require('mongoose');


const CryptoWalletSchema = new mongoose.Schema({
    bnbAmount: {
        type: Number,
        default: 0
    },
    versusAmount: {
        type: Number,
        default: 0
    },
    secretPhrase: {
        type: String,
        default: ''
    },
    currentVote: {
        type: String,
        default: ''
    }
})

const CryptoWallet = mongoose.model('CryptoWallet', CryptoWalletSchema);

module.exports = CryptoWallet;