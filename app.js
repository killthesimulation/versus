const http = require('http');
const express = require('express')
const mongoose = require('mongoose');
const schedule = require('node-schedule')
const app = express();
const server = http.createServer(app);

const db = 'mongodb+srv://cryptoteka:cryptoteka12312@walletcluster.jpvj7.mongodb.net/<dbname>?retryWrites=true&w=majority';


const Wallet = require('./models/WalletModel')


//controllers
const epochController = require('./controllers/epochController');
const walletController = require('./controllers/walletController')



//Connect to Mongo
mongoose.connect(db, { useNewUrlParser : true, useUnifiedTopology: true, useFindAndModify: false})
    .then( () => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));




const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });


io.on('connection', socket => {


    socket.on('login', secretPhrase => {
        walletController.getAllWalletData(secretPhrase)
            .then(data => {
                socket.emit('loginSuccess', data);
            })
    })

    socket.on('placeBidBlue', data => {
        console.log(data);
        epochController.voteForBlueTeam(data.id, data.amount)
            .then(result => {


                walletController.deductWalletBalance(data.id, data.amount)
                    .then(walletUpdated => {


                        walletController.getAllWalletData(data.secretPhrase)
                        .then(data => {
                            socket.emit('bidSuccess', data);
                            io.emit('updateEpoch', data.currentEpoch)
                        })


                    
                    })
           
               



                
            })
    })

    socket.on('placeBidRed', data => {
        epochController.voteForRedTeam(data.id, data.amount)
            .then(result => {


                walletController.deductWalletBalance(data.id, data.amount)
                    .then(walletUpdated => {
                        walletController.getAllWalletData(data.secretPhrase)
                        .then(data => {
                            socket.emit('bidSuccess', data);
                            io.emit('updateEpoch', data.currentEpoch)
                        })
                    })



           
                



                
            })
    })



    socket.on('getReward', id => {
        walletController.getWalletRewardBnb(id)
            .then(reward => {
                Wallet.findOne({_id: id})
                    .then(wallet => {
                        const data = {
                            reward,
                            versusAmount: wallet.versusAmount
                        }
                        socket.emit('updateReward', data)
                    })
               
            })
    })

    socket.on('generateWallet', data => {
        walletController.createWallet()
            .then(wallet => {
                socket.emit('walletGenerated', wallet)
            })
    })

    socket.on('claimReward', data => {
        walletController.transferRewardToWallet(data.id)
            .then(res => {
                walletController.getAllWalletData(data.secretPhrase)
                    .then(result => {
                        socket.emit('rewardCollected', result)
                    })
            })
    })





})



const epochStop = () => {
    epochController.finishEpoch()
        .then(winner => {
            epochController.createNewEpoch()
                .then(res => {
                    epochController.transferLiquidityToNextEpoch(winner)
                        .then(res2 => {
                            epochController.getCurrentEpoch()
                                .then(currentEpoch => {


                                    epochController.getEpochNumber()
                                        .then(epochNumber => {

                                            const data = {
                                                winner,
                                                currentEpoch,
                                                epochNumber
                                            }
        
                                         
        
                                            io.emit('epochRestart', data)

                                        })

                                    




                                })
                        })
                })
        })
}



schedule.scheduleJob('0 3 * * *', () => { epochStop() })
schedule.scheduleJob('0 6 * * *', () => { epochStop() })
schedule.scheduleJob('0 9 * * *', () => { epochStop() })
schedule.scheduleJob('0 12 * * *', () => { epochStop() })
schedule.scheduleJob('0 15 * * *', () => { epochStop() })
schedule.scheduleJob('0 18 * * *', () => { epochStop() })
schedule.scheduleJob('0 21 * * *', () => { epochStop() })
schedule.scheduleJob('0 0 * * *', () => { epochStop() })


schedule.scheduleJob('56 20 * * *', () => { epochStop() })



const PORT = 3001 || process.env.PORT

server.listen(PORT, () => (console.log(`Server fires on ${PORT}`)));