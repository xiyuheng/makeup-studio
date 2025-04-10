const mongoose = require('mongoose');

const photographerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    portfolioImages: [{
        type: String
    }],
    contactInfo: {
        email: String,
        phone: String
    },
    available: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Photographer', photographerSchema); 