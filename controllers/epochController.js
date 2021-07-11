const Epoch = require('../models/EpochModel')
const RewardV2 = require('../models/RewardModelV2')
const ethWalletController = require('../controllers/ethWalletController')
const Vote = require('../models/VoteModel')
const EthWallet = require('../models/EthWalletModel')
const Notification = require('../models/NotificationModel')
const rewardController = require('../controllers/rewardController')

exports.createNewEpoch = () => {
    return new Promise((resolve, reject) => {
        const newEpoch = new Epoch({});
        newEpoch.save()
            .then(result => {
                resolve(result);
            })
    })
}


exports.stopCurrentEpoch = () => {
    return new Promise((resolve, reject) => {
        Epoch.findOne({isActive:true})
            .then(currentEpoch => {
                currentEpoch.isActive = false;
                currentEpoch.save()
                    .then(result => {
                        resolve(result);
                    })
            })
    })
}

exports.getEpochNumber = () => {
    return new Promise((resolve, reject) => {
        Epoch.find({})
        .then(epoches => {
            resolve(epoches.length)
        })
    }) 
}

exports.getCurrentEpoch = () => {
    return new Promise((resolve, reject) => {
        Epoch.findOne({isActive:true})
            .then(currentEpoch => {
                this.calculateTimeLeft()
                    .then(timeLeft => {
                        Epoch.find({})
                            .then(epoches => {
                                currentEpoch.set( 'number',epoches.length, { strict: false })
                                currentEpoch.set( 'timeLeft',timeLeft, { strict: false })
                                resolve(currentEpoch);
                            })
                    })
                
                
            })
    })
}


exports.restartEpoch = () => {
    return new Promise((resolve, reject) => {
        Epoch.findOne({isActive:true})
            .then(currentEpoch => {
                const blueTeamAmount = currentEpoch.blueTeamTotal;
                const redTeamAmount = currentEpoch.redTeamTotal;
                
                console.log(blueTeamAmount, redTeamAmount)

                let winnerTeam;
                let loserTeam;
                let winnerAmount;
                let loserAmount;
                let blueTeamVotes = [];
                let redTeamVotes = [];

                if(blueTeamAmount > redTeamAmount ){
                    winnerTeam = 'blue'
                    winnerAmount = blueTeamAmount
                    loserTeam = 'red'
                    loserAmount = redTeamAmount
                }

                if(blueTeamAmount < redTeamAmount ){
                    winnerTeam = 'red'
                    winnerAmount = redTeamAmount
                    loserTeam = 'blue'
                    loserAmount = blueTeamAmount
                }


                if(blueTeamAmount === redTeamAmount ){
                    winnerTeam = 'none'
                    loserTeam = 'none'
                }

                console.log(winnerTeam, loserTeam)
                console.log(winnerAmount, loserAmount)

                currentEpoch.isActive = false;
                currentEpoch.save()
                    .then(closedEpoch => {
                        if(winnerTeam !== 'none'){
                            Vote.find({
                                epochId: closedEpoch._id,
                                team: winnerTeam,
                            })
    
                                .then(winnerVotes => {
    
                                    const profit = 0.7  * loserAmount

                                        let totalVotesAmountOfWinnerTeam = 0;

                                        winnerVotes.forEach(item => {
                                            totalVotesAmountOfWinnerTeam = totalVotesAmountOfWinnerTeam + item.amount
                                        })


                                        const winnerLeftOverAmount = winnerAmount - totalVotesAmountOfWinnerTeam;

    
                                        winnerVotes.forEach(item => {
                                            const coef = item.amount / totalVotesAmountOfWinnerTeam;
                                            console.log(coef);
                                            const walletProfit = coef * profit;
                                            const returnAmount = (0.95 * walletProfit) + item.amount;
                                            const leftOver = winnerLeftOverAmount * coef;
    
                                            const newReward = new RewardV2({
                                                addr: item.addr,
                                                amount: returnAmount + leftOver,
                                                coin: 'bnb',
                                                team: winnerTeam,
                                                epochNumber:''
                                            })
    
                                            newReward.save()
                                                .then(rewardSaved => {
    
                                                    
    
                                                })
    
                                        })
    
    
                                        const newEpoch = new Epoch({
                                            redTeamTotal: 0.15 * loserAmount,
                                            blueTeamTotal:  0.15 * loserAmount
                                        });
                                        newEpoch.save()
                                            .then(newEpochCreated => {
                                                this.getCurrentEpoch()
                                                    .then(newCurrentEpoch => {
                                                        EthWallet.updateMany({}, {"$set":{"currentVote": ""}})
                                                            .then(res => {
    
    
                                                                
                                                                this.getEpochNumber()
                                                                    .then(epochNumber => {
                                                                        const newNotification = new Notification({
                                                                            title: `Voting Zone #${epochNumber - 1}`,
                                                                            text: `${winnerTeam} Team won ${profit.toFixed(2)} BNB in the Voting Zone #${epochNumber - 1}`
                                                                        })
                                            
            
                                                                        newNotification.save()
                                                                            .then(savedNotification => {
            
    
                                                                                rewardController.giveVersusRewards(closedEpoch._id)
                                                                                    .then(success => {
                                                                                        resolve(newCurrentEpoch);
                                                                                    })
    
                                                                            })
                                                                    })
    
    
                                                                
    
    
    
                                                            })         
                                                    })
                                            })
    
    
                                    }
                                )
    
                        }else{

                            //no votes equal balances

                            const newEpoch = new Epoch({
                                redTeamTotal: closedEpoch.redTeamTotal,
                                blueTeamTotal: closedEpoch.blueTeamTotal
                            });
                            newEpoch.save()
                                .then(newEpochCreated => {
                                    this.getCurrentEpoch()
                                        .then(newCurrentEpoch => {
                                            EthWallet.updateMany({}, {"$set":{"currentVote": ""}})
                                                .then(res => {
                                                    resolve(newCurrentEpoch);
                                                })   
                                        })
                                })


                        }
                    })

            })
    })
}



exports.createVote = (addr, amount, team) => {
    return new Promise((resolve, reject) => {
        Epoch.findOne({isActive: true})
            .then(currentEpoch => {

                if(team === 'blue'){
                    currentEpoch.blueTeamTotal = currentEpoch.blueTeamTotal + amount
                }

                if(team === 'red'){
                    currentEpoch.redTeamTotal = currentEpoch.redTeamTotal + amount
                }


                currentEpoch.save()
                    .then(updatedEpoch => {

                        Vote.findOne({addr: addr, team: team, epochId: updatedEpoch._id})
                            .then(currentVote => {
                                if(currentVote){

                                    currentVote.amount = currentVote.amount + amount;
                                        currentVote.save()
                                            .then(updatedVote => {

                                                EthWallet.findOne({addr: addr})
                                                .then(wallet => {
                                                    wallet.bnbAmount = wallet.bnbAmount - amount;
                                                    wallet.totalVoted = wallet.totalVoted + amount;
                                                    wallet.currentVote = team;
            
                                                    wallet.save()
                                                        .then(updatedWallet => {
                                                            this.getCurrentEpoch()
                                                                .then(finalEpoch => {
                                                                    resolve(finalEpoch)
                                                                })
                                                        })
                                                })

                                            })


                                }else{
                                    const newVote = new Vote({
                                        addr: addr,
                                        amount: amount,
                                        team: team,
                                        epochId: currentEpoch._id
                                    })
                    
                                    newVote.save()
                                        .then(voteSaved => {
                                            EthWallet.findOne({addr: addr})
                                                .then(wallet => {
                                                    wallet.bnbAmount = wallet.bnbAmount - amount;
                                                    wallet.totalVoted = wallet.totalVoted + amount;
                                                    wallet.currentVote = team;
            
                                                    wallet.save()
                                                        .then(updatedWallet => {
                                                            this.getCurrentEpoch()
                                                                .then(finalEpoch => {
                                                                    resolve(finalEpoch)
                                                                })
                                                        })
                                                })
                                        })
                                }
                            })

                    })

            })
    })
}













exports.calculateTimeLeft = () => {
    return new Promise((resolve, reject) => {
        const stopDate1 = new Date();
        stopDate1.setHours(3,0,0,0)
        const stopDate2 = new Date();
        stopDate2.setHours(6,0,0,0)
        const stopDate3 = new Date();
        stopDate3.setHours(9,0,0,0)
        const stopDate4 = new Date();
        stopDate4.setHours(12,0,0,0)
        const stopDate5 = new Date();
        stopDate5.setHours(15,0,0,0)
        const stopDate6 = new Date();
        stopDate6.setHours(18,0,0,0)
        const stopDate7 = new Date();
        stopDate7.setHours(21,0,0,0)
        const stopDate8 = new Date();
        stopDate8.setHours(24,0,0,0)


        const dateNow = new Date();

        const diff1 = stopDate1 - dateNow;
        const diff2 = stopDate2 - dateNow;
        const diff3 = stopDate3 - dateNow;
        const diff4 = stopDate4 - dateNow;
        const diff5 = stopDate5 - dateNow;
        const diff6 = stopDate6 - dateNow;
        const diff7 = stopDate7 - dateNow;
        const diff8 = stopDate8 - dateNow;

        const diffArray = [diff1, diff2, diff3, diff4, diff5, diff6, diff7, diff8];

        const positiveDiffArray = [];

        diffArray.forEach(item => {
            if(item > 0){
                positiveDiffArray.push(item);
            }
        })

 

        const min = Math.min( ...positiveDiffArray)

      

        resolve(min)

    })
}


exports.getNotifications = () => {
    return new Promise((resolve, reject) => {
        Notification.find({}).sort({'_id': -1}).limit(5)
            .then(notifications => {
                resolve(notifications);
            })
    })
}