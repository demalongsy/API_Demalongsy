var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')
const admin = require('firebase-admin')
const multer = require('multer')

const bucket = admin.storage().bucket()
const upload = multer()

router.get('/', async (req, res) => {
  try {
    let result = []

    const getData = await db.collection('users').get()

    getData.forEach((val) => {
      result.push(val.data())
    })

    res.status(200).json({ data: result })
  } catch (error) {
    res.send(error)
  }
})

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params
    const { another_username } = req.query
    let result
    let num_was_liked = 0
    let num_postes = 0

    const getPosts = await db
      .collection('blocks')
      .where('username', '==', another_username ?? username)
      .get()
    getPosts.forEach((val) => {
      num_postes += 1
      num_was_liked += val.data().liked.length
    })

    const getData = await db
      .collection('users')
      .where('username', '==', another_username ?? username)
      .get()

    getData.forEach((val) => {
      result = val.data()
      result.user_id = val.id
    })

    if (another_username === username) {
      result.isOwner = true
    } else {
      result.isOwner = false
    }

    result.num_postes = num_postes
    result.num_was_liked = num_was_liked

    res.status(200).json(result)
  } catch (error) {
    res.send(error)
  }
})

router.get('/viewprofile/post', async (req, res) => {
  try {
    const { user_id, another_id } = req.query
    let allPost = []

    if (user_id && another_id) {
      const getData = await db.collection('blocks').where('author_id', '==', another_id).get()
      getData.forEach((val) => {
        allPost.push({ id: val.id, ...val.data() })
      })
    } else {
      const getData = await db.collection('blocks').where('author_id', '==', user_id).get()
      getData.forEach((val) => {
        allPost.push({ id: val.id, ...val.data() })
      })
    }

    allPost.map((val) => {
      val.isLiked = false
      if (val.liked.length > 0) {
        val.liked.map((obj) => {
          if (obj == user_id) {
            val.isLiked = true
          }
        })
      }
    })

    res.status(200).json({ data: allPost })
  } catch (error) {
    res.send(error)
  }
})

router.get('/viewprofile/liked', async (req, res) => {
  try {
    const { user_id, another_id } = req.query
    let allPost = []

    if (user_id && another_id) {
      const getData = await db.collection('blocks').where('liked', 'array-contains', another_id).get()
      getData.forEach((val) => {
        allPost.push({ id: val.id, ...val.data() })
      })
    } else {
      const getData = await db.collection('blocks').where('liked', 'array-contains', user_id).get()
      getData.forEach((val) => {
        allPost.push({ id: val.id, ...val.data() })
      })
    }

    allPost.map((val) => {
      val.isLiked = false
      if (val.liked.length > 0) {
        val.liked.map((obj) => {
          if (obj == user_id) {
            val.isLiked = true
          }
        })
      }
    })

    res.status(200).json({ data: allPost })
  } catch (error) {
    res.send(error)
  }
})

router.patch('/selectedTags/:user_id', middleware.checkToken, async (req, res) => {
  try {
    const { user_id } = req.params
    const { tags } = req.body

    const updatedata = await db.collection('users').doc(user_id).update({ tags: tags })

    res.status(200).json({ msg: 'Data successfully updated.' })
  } catch (error) {
    res.send(error)
  }
})

router.patch('/liked', middleware.checkToken, async (req, res) => {
  try {
    const { block_id, user_id } = req.query

    const blocksRef = db.collection('blocks').doc(block_id)
    await blocksRef.update({ liked: admin.firestore.FieldValue.arrayUnion(user_id) })

    res.status(200).json({ msg: 'Data successfully updated.' })
  } catch (error) {
    res.send(error)
  }
})

router.patch('/unliked', middleware.checkToken, async (req, res) => {
  try {
    const { block_id, user_id } = req.query

    const blocksRef = db.collection('blocks').doc(block_id)
    await blocksRef.update({ liked: admin.firestore.FieldValue.arrayRemove(user_id) })

    res.status(200).json({ msg: 'Data successfully updated.' })
  } catch (error) {
    res.send(error)
  }
})

router.patch('/edit/:user_id', upload.single('imgAuthor'), middleware.checkToken, async (req, res) => {
  try {
    const { user_id } = req.params

    let allPostId = []
    let allCommentId = []
    let updateData = {}
    let updatePost = {}

    if (req.body.name) {
      updateData.name = req.body.name
      updatePost.name = req.body.name
    }

    if (req.body.bio) {
      updateData.bio = req.body.bio
    }

    if (req.file) {
      const file = req.file
      const destinationPath = `profile/${file.originalname}`

      const fileBuffer = file.buffer
      const contentType = file.mimetype

      const fileUpload = bucket.file(destinationPath)

      // Create a write stream for uploading the file
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: contentType,
        },
      })

      // Handle stream events
      stream.on('error', (error) => {
        console.error('Error uploading image:', error)
        //res.status(500).send('An error occurred while uploading the image.')
      })

      stream.on('finish', async () => {
        const imgAuthor = await fileUpload.getSignedUrl({
          action: 'read',
          expires: '03-01-2500',
          // Set an appropriate expiration date
        })

        updateData.imgAuthor = imgAuthor[0]
        updatePost.imgAuthor = imgAuthor[0]

        await db.collection('users').doc(user_id).update(updateData)

        const dataPost = await db.collection('blocks').where('author_id', '==', user_id).get()
        const dataComments = await db.collection('comments').where('author_id', '==', user_id).get()

        dataPost.forEach((val) => {
          allPostId.push(val.id)
        })

        dataComments.forEach((val) => {
          allCommentId.push(val.id)
        })

        if (allPostId.length > 0) {
          allPostId.map(async (val) => {
            await db.collection('blocks').doc(val).update(updatePost)
          })
        }

        if (allCommentId.length > 0) {
          allCommentId.map(async (val) => {
            await db.collection('comments').doc(val).update(updatePost)
          })
        }

        res.status(200).json({ msg: 'Data successfully updated.' })
      })

      stream.end(fileBuffer)
    } else {
      await db.collection('users').doc(user_id).update(updateData)

      const dataPost = await db.collection('blocks').where('author_id', '==', user_id).get()
      const dataComments = await db.collection('comments').where('author_id', '==', user_id).get()

      dataPost.forEach((val) => {
        allPostId.push(val.id)
      })

      dataComments.forEach((val) => {
        allCommentId.push(val.id)
      })

      if (allPostId.length > 0) {
        allPostId.map(async (val) => {
          await db.collection('blocks').doc(val).update(updatePost)
        })
      }

      if (allCommentId.length > 0) {
        allCommentId.map(async (val) => {
          await db.collection('comments').doc(val).update(updatePost)
        })
      }

      res.status(200).json({ msg: 'Data successfully updated.' })
    }
  } catch (error) {
    res.send(error)
  }
})
module.exports = router
