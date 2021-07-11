const http = require('http');
const express = require('express')
const mongoose = require('mongoose');
const schedule = require('node-schedule')
const app = express();
const server = http.createServer(app);

const db = 'mongodb+srv://cryptoteka:cryptoteka12312@walletcluster.jpvj7.mongodb.net/<dbname>?retryWrites=true&w=majority';

const Notification = require('./models/NotificationModel')

//controllers
const epochController = require('./controllers/epochController');
const ethWalletController = require('./controllers/ethWalletController')
const rewardController = require('./controllers/rewardController')



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

   
    //login
    socket.on('ethLogin', addr => {
        ethWalletController.getWalletDetails(addr)
            .then(data => {
                socket.emit('ethLoginSuccess', data)
            })
    })


    //claim reward
    socket.on('claimReward', data => {
        if(data.coin === "bnb"){
            rewardController.claimBnbReward(data.addr)
                .then(res => {
                    socket.emit('claimRewardSucces', 'bnb')
                })
        }
        if(data.coin === "versus"){
            rewardController.claimVersusReward(data.addr)
            .then(res => {
                socket.emit('claimRewardSucces', 'versus')
            })
        }  
    })

    //Vote for red
    socket.on('voteForRed', data => {
    const addrSting = data.addr;
    const shortAddr = `${addrSting.substring(0,6)}...${addrSting.substring(38,42)}`;
    const amount = data.amount;
       epochController.createVote(data.addr, data.amount, 'red')
        .then(result => {
            ethWalletController.getWalletDetails(data.addr)
                .then(data => {
                    socket.emit('updateWallet', data)
                    epochController.getCurrentEpoch()
                        .then(currentEpoch => {
                            

                            epochController.getEpochNumber()
                                .then(epochNumber => {
                                    const newNotification = new Notification({
                                        title: `New Vote`,
                                        text: `User ${shortAddr} voted ${amount.toFixed(2)} BNB for Red Team`
                                    })
        
                                    newNotification.save()
                                        .then(savedNotification => {
                                            epochController.getNotifications()
                                            .then(notifications => {
                                                io.emit('updateEpoch', currentEpoch)
                                                io.emit('updateNotifications', notifications)
                                            })
                                        })
                                })

                            


                        })
                })
        })
    })

      //Vote for Blue
      socket.on('voteForBlue', data => {
        const addrSting = data.addr;
        const shortAddr = `${addrSting.substring(0,6)}...${addrSting.substring(38,42)}`;
        const amount = data.amount;
        epochController.createVote(data.addr, data.amount, 'blue')
         .then(result => {
             ethWalletController.getWalletDetails(data.addr)
                 .then(data => {
                     socket.emit('updateWallet', data)
                     epochController.getCurrentEpoch()
                        .then(currentEpoch => {
                            epochController.getEpochNumber()
                            .then(epochNumber => {
                                const newNotification = new Notification({
                                    title: `New Vote`,
                                    text: `User ${shortAddr} voted ${amount.toFixed(2)} BNB for Blue Team`
                                })
    
                                newNotification.save()
                                    .then(savedNotification => {
                                        epochController.getNotifications()
                                            .then(notifications => {
                                                io.emit('updateEpoch', currentEpoch)
                                                io.emit('updateNotifications', notifications)
                                            })
                                        
                                    })
                            })
                           
                        })
                 })
         })
     })
 

     socket.on('updateWalletTrigger', addr => {
        ethWalletController.getWalletDetails(addr)
            .then(data => {
                socket.emit('updateWallet', data)
            })
    })

})




const restartEpochTrigger = () => {
    epochController.restartEpoch()
        .then(epoch => {
            epochController.getNotifications()
                .then(notifications => {
                    io.emit('restartEpoch', epoch)
                    io.emit('updateNotifications', notifications)
                })
        })
}



schedule.scheduleJob('0 3 * * *', () => { restartEpochTrigger() })
schedule.scheduleJob('0 6 * * *', () => { restartEpochTrigger() })
schedule.scheduleJob('0 9 * * *', () => { restartEpochTrigger() })
schedule.scheduleJob('0 12 * * *', () => { restartEpochTrigger() })
schedule.scheduleJob('0 15 * * *', () => { restartEpochTrigger() })
schedule.scheduleJob('0 18 * * *', () => { restartEpochTrigger() })
schedule.scheduleJob('0 21 * * *', () => { restartEpochTrigger() })
schedule.scheduleJob('0 0 * * *', () => { restartEpochTrigger() })


schedule.scheduleJob('47 20 * * *', () => {restartEpochTrigger() })



const PORT = 3001 || process.env.PORT

server.listen(PORT, () => (console.log(`Server fires on ${PORT}`)));