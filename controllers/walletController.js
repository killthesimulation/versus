const Wallet = require('../models/WalletModel')
const Reward = require('../models/RewardModel')
const epochController = require('../controllers/epochController')
const randomWords = require('random-words');


exports.createWallet = () => {
    return new Promise((resolve, reject) => {
        const newSecretPhrase = randomWords(10).toString()
        const formatedSecretPhrase = newSecretPhrase.replace(/,/g, ' ')

        const newWallet = new Wallet({
            bnbAmount: 100,
            secretPhrase: formatedSecretPhrase
        })
            newWallet.save()
                .then(result => {
                    resolve(result);
                })
    })
}

exports.findWallet = (secretPhrase) => {
    return new Promise((resolve, reject) => {
        Wallet.findOne({secretPhrase:secretPhrase})
            .then(result => {
                if(result){
                    resolve(result._id)
                }else{
                    reject('fail')
                }
            })
    })
}

exports.getAllWalletData = (secretPhrase) => {
    return new Promise((resolve, reject) => {
        this.findWallet(secretPhrase)
            .then(walletId => {

                if(walletId){

                    epochController.getCurrentEpoch()
                    .then(currentEpoch => {
                        epochController.getBidAmountForBlue(walletId)
                            .then(bidAmountForBlue => {
                                epochController.getBidAmountForRed(walletId)
                                .then(bidAmountForRed => {

                                    epochController.getEpochNumber()
                                        .then(epochNumber => {


                                            this.getCurrentVoteTeam(walletId)
                                                .then(currentVote=> {

                                                  this.getWalletRewardBnb(walletId)
                                                    .then(bnbReward => {


                                                        this.getWalletBnbAmount(walletId)
                                                            .then(bnbAmount => {

                                                                this.getVersusAmount(walletId)
                                                                    .then(versusAmount => {

                                                                        const data = {
                                                                            walletId,
                                                                            secretPhrase,
                                                                            currentEpoch,
                                                                            bidAmountForBlue,
                                                                            bidAmountForRed,
                                                                            epochNumber,
                                                                            currentVote,
                                                                            bnbReward: bnbReward,
                                                                            bnbAmount,
                                                                            versusAmount
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

                }else{
                    reject('error');
                }

            
            
            
                })
    })
}

exports.setCurrentVoteTeam = (id, team) => {
    return new Promise((resolve, reject) => {
        Wallet.findOne({_id: id})
            .then(wallet => {
                wallet.currentVote = team;
                wallet.save()
                    .then(result =>{
                        resolve(result);
                    })
            })
    })
}

exports.getCurrentVoteTeam = (id) => {
    return new Promise((resolve, reject) => {
        Wallet.findOne({_id: id})
            .then(wallet => {
                resolve(wallet.currentVote)
            })
    })
}

exports.resetCurrentVoteTeam = () => {
    return new Promise((resolve, reject) => {
        Wallet.updateMany({}, {currentVote: ''})
            .then(res => {
                resolve(res)
            })
    })
}

exports.getWalletRewardBnb = (id) => {
    return new Promise((resolve, reject) => {
        Reward.find({userId: id, coin: 'bnb'})
            .then(rewards => {

                if(rewards){
                    let rewardTotal = 0;
                    rewards.forEach(item => {
                        rewardTotal = rewardTotal + item.amount
                    });
                    resolve(rewardTotal);
                }else{
                    resolve(0);
                }

                



            })
            
    })
}

exports.transferRewardToWallet = (id) => {
    return new Promise((resolve, reject) => {
        Reward.find({userId: id, coin: 'bnb'})
            .then(rewards => {
                let rewardTotal = 0;
                rewards.forEach(item => {
                    rewardTotal = rewardTotal + item.amount
                });
                const rounded = Math.round((rewardTotal + Number.EPSILON) * 100) / 100;
                this.addWalletBalance(id, rounded)
                    .then(rewardTransfered => {
                        
                        Reward.deleteMany({userId: id})
                            .then(deleteRes => {
                               
                                resolve('ok')
                            })
                    })
            })
    })
}

exports.getWalletBnbAmount = (id) => {
    return new Promise((resolve, reject) => {
        Wallet.findOne({_id: id})
            .then(wallet => {
                resolve(wallet.bnbAmount)
            })
    })
}

exports.deductWalletBalance = (id, amount) => {
    return new Promise((resolve, reject) => {
        Wallet.findOne({_id: id})
            .then(wallet => {
                wallet.bnbAmount = wallet.bnbAmount - amount;
                wallet.save()
                    .then(result=>{
                        resolve(result);
                    })
            })
    })
}

exports.addWalletBalance = (id, amount) => {
    return new Promise((resolve, reject) => {
        Wallet.findOne({_id: id})
            .then(wallet => {
                wallet.bnbAmount = wallet.bnbAmount + amount;
                wallet.save()
                    .then(result=>{
                        resolve(result);
                    })
            })
    })
}

exports.giveVersusToWallets = () => {
    return new Promise((resolve, reject) => {
       epochController.getCurrentEpoch()
            .then(currentEpoch => {
                if(currentEpoch.votes){
                    let ids = []
                currentEpoch.votes.forEach(item => {
                    ids.push(item.userId);
                })
                Wallet.updateMany({_id:{$in: ids}}, {$inc:{versusAmount:1}})
                    .then(updatedWallets => {
                        resolve(updatedWallets);
                    })
                }else{
                    resolve('ok')
                }
            })
    })
}

exports.getVersusAmount = (id) => {
    return new Promise((resolve, reject) => {
        Wallet.findOne({_id: id})
            .then(wallet => {
                resolve(wallet.versusAmount)
            })
    })
}