const jwt = require('jsonwebtoken')
const config = require('./config')

module.exports.checkToken = (req, res, next) => {
  let token = req.headers['authorization']
  token = token.slice(7, token.length)
  if (token) {
    jwt.verify(token, config.key, (error, decode) => {
      if (error) {
        return res.json({
          status: false,
          msg: 'token in valid',
        })
      } else {
        req.decoded = decode
        next()
      }
    })
  } else {
    return res.json({
      status: false,
      msg: 'Token is not provided',
    })
  }
}
