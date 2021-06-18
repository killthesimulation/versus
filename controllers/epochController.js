const Epoch = require('../models/EpochModel')
const Reward = require('../models/RewardModel')
const walletController = require('../controllers/walletController')

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
                        currentEpoch.set( 'timeLeft',timeLeft, { strict: false })
                        resolve(currentEpoch);
                    })
                
                
            })
    })
}


exports.voteForBlueTeam = (id, amount) => {
    return new Promise((resolve, reject) => {

        Epoch.findOne({isActive:true})
            .then(currentEpoch => {
                currentEpoch.blueTeamTotal = currentEpoch.blueTeamTotal + amount;
                currentEpoch.save()
                    .then(result => {
                        this.saveBidToEpoch(id, amount, 'blue')
                            .then(res => {
                                walletController.setCurrentVoteTeam(id, 'blue')
                                    .then(res2=>{
                                        resolve(result)
                                    })
                                
                            })
                       
                    })
            })

    })
    
}


exports.voteForRedTeam = (id, amount) => {
    return new Promise((resolve, reject) => {

        Epoch.findOne({isActive:true})
        .then(currentEpoch => {
            currentEpoch.redTeamTotal = currentEpoch.redTeamTotal + amount;
            currentEpoch.save()
                .then(result => {
                    this.saveBidToEpoch(id, amount, 'red')
                            .then(res => {
                                walletController.setCurrentVoteTeam(id, 'red')
                                    .then(res2=>{
                                        resolve(result)
                                    })
                            })
                    })
        })

    })
    
}


exports.chooseWinner = () => {
    return new Promise((resolve, reject) => {
        this.getCurrentEpoch()
            .then(currentEpoch => {
                if(currentEpoch.redTeamTotal > currentEpoch.blueTeamTotal){
                    resolve('red')
                }
                if(currentEpoch.redTeamTotal < currentEpoch.blueTeamTotal){
                    resolve('blue')
                }

                if(currentEpoch.redTeamTotal === currentEpoch.blueTeamTotal){
                    resolve('same')
                }
            })
    })
}


exports.saveBidToEpoch = (id, amount, team) => {
    return new Promise((resolve, reject) => {
        console.log(id);
        this.getCurrentEpoch()
            .then(currentEpoch => {
                currentEpoch.votes.push({
                    userId: id,
                    amount,
                    team
                })
                currentEpoch.save()
                    .then(result2 => {
                        resolve(result2);
                    })
            })
    })
}


exports.getBidAmountForBlue = (id) => {
    return new Promise((resolve, rejects) => {
        this.getCurrentEpoch()
            .then(currentEpoch => {
                let obj = currentEpoch.votes.filter(obj=>obj.userId== id && obj.team == 'blue');
                let totalAmount = 0;
              
               
                obj.forEach(item => {
                   
                    totalAmount =  totalAmount + item.amount
                });
                
                resolve(totalAmount);
            })
    })
}


exports.getBidAmountForRed = (id) => {
    return new Promise((resolve, rejects) => {
       
        this.getCurrentEpoch()
            .then(currentEpoch => {
                let obj = currentEpoch.votes.filter(obj=>obj.userId== id && obj.team == 'red');
                let totalAmount = 0;
             
               
                obj.forEach(item => {
                   
                    totalAmount =  totalAmount + item.amount
                });
                
                resolve(totalAmount);
            })
    })
}


exports.returnWinnersBid = (winner) => {
    return new Promise((resolve, reject) => {
        this.getCurrentEpoch()
            .then(currentEpoch => {
                let winnerWallets = currentEpoch.votes.filter(obj => obj.team == winner);
                winnerWallets.forEach(item => {

                    const newReward = new Reward({
                        userId: item.userId,
                        amount: item.amount,
                        coin: 'bnb',
                    })

                    newReward.save()
                        .then(rewardSaved=> {
                       
                        })
                   
                })
                resolve('bids returned');
            })
    })
}


exports.calculateEpochResults = (winner) => {
    return new Promise((resolve, reject) => {

        if(winner === 'same'){
            resolve('ok')
        }else{

            this.getCurrentEpoch()
            .then(currentEpoch => {
                let winnerWallets = currentEpoch.votes.filter(obj => obj.team == winner);
                let totalTeamWon;
                if(winner === 'blue'){
                    totalTeamWon = currentEpoch.redTeamTotal * 0.7;
                    winnerWallets.forEach(item => {
                        const teamCoef = item.amount / currentEpoch.blueTeamTotal;
                        const winAmount = teamCoef * totalTeamWon;
                       

                        const newReward = new Reward({
                            userId: item.userId,
                            amount: winAmount,
                            coin: 'bnb',
                        })

                        newReward.save()
                            .then(rewardSaved=> {
                           
                            })

                    })

                    resolve('blue win')

                }else if(winner === 'red'){
                    totalTeamWon = currentEpoch.blueTeamTotal * 0.7;
                    winnerWallets.forEach(item => {
                        const teamCoef = item.amount / currentEpoch.redTeamTotal;
                        const winAmount = teamCoef * totalTeamWon;
                     


                        const newReward = new Reward({
                            userId: item.userId,
                            amount: winAmount,
                            coin: 'bnb',
                        })

                        newReward.save()
                            .then(rewardSaved=> {
                              
                            })

                    })

                    resolve('red win')
                }
            })

        }


      
   
   
   
   
   
        })
}


exports.finishEpoch = () => {
    return new Promise((resolve, reject) => {
        this.chooseWinner()
            .then(winner => {



                this.returnWinnersBid(winner)
                    .then(winnersBids => {
                        this.calculateEpochResults(winner)
                        .then(calculated => {
    
                            walletController.giveVersusToWallets()
                                .then(versusRes => {
    
                                    this.stopCurrentEpoch()
                                    .then(epoch => {
                                        walletController.resetCurrentVoteTeam()
                                            .then(res => {
                                            
                                                      
                                                        resolve(winner);
                                                    
                                            
                                            })
                                        
                                    })
        
        
                                })
       
    
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


exports.transferLiquidityToNextEpoch = (lastWinner) => {
    return new Promise((resolve, reject) => {

        if(lastWinner === 'same'){
            resolve('ok')
        }else{

            Epoch.findOne({isActive: false}).sort({'_id': -1})
            .then(lastEpoch => {
                this.getCurrentEpoch()
                    .then(currentEpoch => {

                        
                        if(lastWinner === 'blue'){
                            currentEpoch.redTeamTotal = lastEpoch.redTeamTotal * 0.15;
                            currentEpoch.blueTeamTotal = lastEpoch.redTeamTotal * 0.15;
                        }

                        if(lastWinner === 'red'){
                            currentEpoch.redTeamTotal = lastEpoch.blueTeamTotal * 0.15;
                            currentEpoch.blueTeamTotal = lastEpoch.blueTeamTotal * 0.15;
                        }

                        currentEpoch.save()
                            .then(finalResult => {
                                resolve(finalResult)
                            })
                        
                    })
            })

        }


        
    
    
    
    
    
    
    
    
    
        })
}

