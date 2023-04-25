const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const config = require('./config')
const app = express()

//routes
const authRoutes = require('./routes/auth_routes')
const tagsRoutes = require('./routes/tags_routes')
const profileRoutes = require('./routes/profile_routes')
const itemsRoutes = require('./routes/items_routes')
const commentsRoutes = require('./routes/comments_routes')

app.use(express.json())
app.use(cors())
app.use(bodyParser.json())

app.use('/auth', authRoutes)
app.use('/tags', tagsRoutes)
// app.use('/profile', profileRoutes)
// app.use('/items', itemsRoutes)
// app.use('/comment', commentsRoutes)

app.listen(config.port, () => console.log('App is listening on our http://localhost:' + config.port))
