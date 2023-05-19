const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const config = require('./config')
const app = express()

//routes
const authRoutes = require('./routes/auth_routes')
const tagsRoutes = require('./routes/tags_routes')
const profileRoutes = require('./routes/profile_routes')
const styleRoutes = require('./routes/style_routes')
const commentsRoutes = require('./routes/comments_routes')
const feedbackRoutes = require('./routes/feedback_routes')
const blockRoutes = require('./routes/blocks_routes')

app.use(express.json())
app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))

app.use('/auth', authRoutes)
app.use('/tags', tagsRoutes)
app.use('/profile', profileRoutes)
app.use('/similarStyle', styleRoutes)
app.use('/comment', commentsRoutes)
app.use('/feedbacks', feedbackRoutes)
app.use('/blocks', blockRoutes)

app.listen(config.port, () => console.log('App is listening on our http://localhost:' + config.port))
