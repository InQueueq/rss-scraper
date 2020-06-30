const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
    title: String,
    link: String,
    pubDate: Date,
    comments: String,
    content: String,
    contentSnippet: String,
    isoDate: Date,
    keywords:{
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('article',articleSchema)