const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['个人写真', '婚纱照', '商业摄影', '艺术摄影', '其他']
    },
    mainImage: {
        type: String,
        required: true
    },
    images: [{
        url: String,
        caption: String
    }],
    photographer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photographer',
        required: true
    },
    makeupDetails: {
        type: String
    },
    shootingLocation: {
        type: String
    },
    shootingDate: {
        type: Date
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Portfolio', portfolioSchema); 