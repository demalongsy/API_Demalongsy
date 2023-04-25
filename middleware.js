const jwt = require('jsonwebtoken')
const config = require('./config')

module.exports.checkToken = (req, res, next) => {
    let token = req.headers["authorization"]
    console.log(token)
}