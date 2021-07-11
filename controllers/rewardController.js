const RewardV2 = require('../models/RewardModelV2')
const EthWallet = require('../models/EthWalletModel')
const Vote = require('../models/VoteModel')

exports.createReward = (addr, amount, coin, epochNumber) => {
    return new Promise((resolve, reject) => {
        const newReward = new RewardV2({
            addr,
            amount,
            coin,
            epochNumber
        })

        newReward.save()
            .then(res => {
                resolve(res)
            })
    })
}

exports.giveVersusRewards = (epochId) => {
    return new Promise((resolve, reject) => {
        Vote.find({
            epochId: epochId,
        })
        .then(votes => {
            votes.forEach(item => {
                const newReward = new RewardV2({
                    addr: item.addr,
                    amount: 1,
                    coin: 'versus'
                })

                newReward.save()
                    .then(rewardSaved => {

                    })
            })
            
            resolve('success')
        
        })
    })
}

exports.getReward = (addr) => {
    return new Promise((resolve, reject) => {
        RewardV2.find({addr: addr, isActive: true})
            .then(rewards => {
                let bnbReward = 0;
                let versusReward = 0;
                rewards.map(item => {
                    if(item.coin === 'bnb'){
                        bnbReward = bnbReward + item.amount
                    }

                    if(item.coin === 'versus'){
                        versusReward = versusReward + item.amount
                    }
                   
                })
                const rewardData = {
                    bnbReward,
                    versusReward
                }
                resolve(rewardData);
            })
    })
}



exports.claimBnbReward = (addr) => {
    return new Promise((resolve, reject) => {
        this.getReward(addr)
            .then(reward => {
                EthWallet.findOne({addr: addr})
                    .then(wallet => {
                        wallet.bnbAmount = wallet.bnbAmount + reward.bnbReward;
                        wallet.totalEarned = wallet.totalEarned + reward.bnbReward;
                        wallet.save()
                            .then(res => {

                                RewardV2.updateMany({addr: addr, coin: 'bnb', isActive: true}, {"$set":{"isActive": false}})
                                    .then(result => {
                                        resolve(result);
                                    })
                                
                            })
                    })
            })
    })
}


exports.claimVersusReward = (addr) => {
    return new Promise((resolve, reject) => {
        this.getReward(addr)
            .then(reward => {
                EthWallet.findOne({addr: addr})
                    .then(wallet => {
                        wallet.versusAmount = wallet.versusAmount + reward.versusReward
                        wallet.save()
                            .then(res => {
                                RewardV2.updateMany({addr: addr, coin: 'versus', isActive: true}, {"$set":{"isActive": false}})
                                    .then(result => {
                                        resolve(result);
                                    })
                            })
                    })
            })
    })
}

