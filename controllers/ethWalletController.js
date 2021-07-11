const EthWallet = require('../models/EthWalletModel')
const Vote = require('../models/VoteModel')
const Epoch = require('../models/EpochModel')
const rewardController = require('./rewardController')
const epochController = require('./epochController')
const RewardV2 = require('../models/RewardModelV2')

exports.getTotalEpoches = (addr) => {
    return new Promise((resolve, reject) => {
        Vote.find({addr: addr})
            .then(votes => {
                resolve(votes.length)
            })
    })
}

exports.createEthWallet = (addr) => {
    return new Promise((resolve, reject) => {
        const newEthWallet = new EthWallet({
            bnbAmount: 100,
            addr: addr
        })
        newEthWallet.save()
            .then(res => {
                resolve(res)
            })
    })
}

exports.checkWallet = (addr) => {
    return new Promise((resolve, reject) => {
        EthWallet.findOne({addr: addr})
            .then(result => {
                if(result){
                    resolve(result);
                }else{
                    this.createEthWallet(addr)
                        .then(createdWallet => {
                            resolve(createdWallet);
                        })
                }
            })
    })
}

exports.getWalletDetails = (addr) => {
    return new Promise((resolve, reject) => {
        this.checkWallet(addr)
            .then(wallet => {
                rewardController.getReward(addr)
                    .then(reward => {


                    epochController.getCurrentEpoch()
                        .then(epoch => {

                            this.getCurrentEpochVote(addr)
                                .then(votes => {


                                    epochController.getNotifications()
                                        .then(notifications => {



                                            this.getLatestWinners()
                                                .then(latestWinners => {

                                                    this.getTotalEpoches(addr)
                                                        .then(totalEpoches => {

                                                        
                                                            this.getRank(addr)
                                                                .then(rank => {
                                                                  
                                                                    const data = {
                                                                        wallet,
                                                                        reward,
                                                                        epoch,
                                                                        votes,
                                                                        notifications,
                                                                        latestWinners,
                                                                        totalEpoches,
                                                                        rank
                                                                    }
                                            
                                                                    resolve(data)
                                                                })
                                                            



                                                        })

                                                   



                                                })

                                            
                                        })

                                   




                                })

                            



                        })


                        



                    })
            })
    })
}


exports.getCurrentEpochVote = (addr) => {
    return new Promise((resolve, reject) => {
        Epoch.findOne({isActive: true})
            .then(currentEpoch => {
                let voteForBlue = 0;
                let voteForRed = 0;

                Vote.find({addr: addr, epochId: currentEpoch._id})
                    .then(votes => {


                        votes.forEach(item => {
                            if(item.team === 'blue'){
                                voteForBlue = voteForBlue + item.amount
                            }

                            if(item.team === 'red'){
                                voteForRed = voteForRed + item.amount
                            }

                        })


                        const data = {
                            voteForBlue,
                            voteForRed
                        }


                        resolve(data);


                    })
            })
    })
}

exports.getLatestWinners = () => {
    return new Promise((resolve, reject) => {
        RewardV2.find({coin:"bnb"}).sort({'_id': -1}).limit(15)
            .then(winners => {
                resolve(winners);
            })
    })
}

exports.getRank = (addr) => {
    return new Promise((resolve, reject) => {
        EthWallet.find({}).sort({'bnbAmount': -1})
            .then(wallets => {
                const totalWallets = wallets.length;
                const rank = wallets.findIndex(x => x.addr === addr) + 1
                const data = {
                    totalWallets,
                    rank
                }
                resolve(data)
            })
    })
}