const mongoose = require('mongoose');


const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        default: ''
    },
    text: {
        type: String,
        default: ''
    },
})

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;