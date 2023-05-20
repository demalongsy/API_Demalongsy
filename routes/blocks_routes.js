var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')
const admin = require('firebase-admin')
const multer = require('multer')

const bucket = admin.storage().bucket()

// Configure Multer for file upload
const upload = multer()

router.get('/', async (req, res) => {
  try {
    let result = {}
    allPosts = []
    const { user_id } = req.query

    const getData = await db.collection('blocks').orderBy('date', 'desc').get()

    getData.forEach((val) => {
      result = val.data()
      result.id = val.id
      allPosts.push(result)
    })

    allPosts.map((val) => {
      if (val.liked.length > 0) {
        if (val.liked.find((obj) => obj === user_id)) {
          val.isLiked = true
        } else {
          val.isLiked = false
        }
      } else {
        val.isLiked = false
      }
    })

    res.status(200).json({ data: allPosts })
  } catch (error) {
    res.send(error)
  }
})

router.get('/trending', async (req, res) => {
  try {
    const { user_id } = req.query
    let allPosts = []
    let finalResult = []
    let result
    let num = 0

    const getData = await db.collection('tags').orderBy('num_mention', 'desc').get()

    await Promise.all(
      getData.docs.map(async (val) => {
        const getPost = await db.collection('blocks').where('tags', 'array-contains', val.data().tags).get()

        getPost.forEach((obj) => {
          result = obj.data()
          result.id = obj.id
          allPosts.push(result)
        })
      })
    )

    allPosts.map((val) => {
      num = 0
      finalResult.map((obj) => {
        if (obj.id === val.id) {
          num += 1
        }
      })

      if (num < 1) {
        result = val
        if (val.liked.find((res) => res === user_id)) {
          val.isLiked = true
        } else {
          val.isLiked = false
        }
        finalResult.push(val)
      }
    })

    res.status(200).json({ data: finalResult })
  } catch (error) {
    res.send(error)
  }
})

router.get('/foryou', async (req, res) => {
  try {
    const { user_id } = req.query
    let allPosts = []
    let result
    let num = 0

    const getUser = await db.collection('users').doc(user_id).get()
    const selectedTags = getUser.data().tags

    const getPosts = await db.collection('blocks').where('tags', 'array-contains-any', selectedTags).orderBy('date', 'desc').get()

    getPosts.forEach((val) => {
      result = val.data()
      result.id = val.id
      allPosts.push(result)
    })

    const getOtherPost = await db.collection('blocks').get()

    getOtherPost.forEach((val) => {
      num = 0

      if (allPosts.find((obj) => obj.id === val.id)) {
        num += 1
      }

      if (num < 1) {
        result = val.data()
        result.id = val.id
        allPosts.push(result)
      }
    })

    allPosts.map((val) => {
      if (val.liked.length > 0) {
        if (val.liked.find((obj) => obj === user_id)) {
          val.isLiked = true
        } else {
          val.isLiked = false
        }
      } else {
        val.isLiked = false
      }
    })

    res.status(200).json({ data: allPosts })
  } catch (error) {
    res.send(error)
  }
})

router.get('/view/:block_id', async (req, res) => {
  try {
    const { block_id } = req.params
    const { user_id } = req.query
    let result
    let isLiked = false

    const getBlock = await db.collection('blocks').doc(block_id).get()
    result = getBlock.data()

    if (getBlock.data().author_id === user_id) {
      result.isOwner = true
    } else {
      result.isOwner = false
    }

    if (getBlock.data().liked.length > 0) {
      if (getBlock.data().liked.find((val) => val.toString() === user_id)) {
        isLiked = true
      } else {
        isLiked = false
      }
    }
    result.isLiked = isLiked
    result.block_id = block_id

    res.status(200).json(result)
  } catch (error) {
    res.send(error)
  }
})

router.get('/related/:block_id', async (req, res) => {
  try {
    let allPost = []
    let result

    const { block_id } = req.params
    const { tags, user_id } = req.query

    let removeRight = tags.slice(1, tags.length - 1)

    let allTags = removeRight.split(',')

    const getData = await db.collection('blocks').where('tags', 'array-contains-any', allTags).get()

    getData.forEach((val) => {
      if (val.id !== block_id) {
        result = val.data()
        result.id = val.id

        allPost.push(result)
      }
    })
    allPost.map((val) => {
      if (val.liked.length > 0) {
        val.liked.map((obj) => {
          if (obj === user_id) {
            val.isLiked = true
          } else {
            val.isLiked = false
          }
        })
      } else {
        val.isLiked = false
      }
    })

    res.status(200).json({ data: allPost })
  } catch (error) {
    res.send(error)
  }
})

router.post('/create', upload.array('images', 6), middleware.checkToken, async (req, res) => {
  try {
    const date = new Date()
    let getTags
    let num_mention = 0
    let int = 0
    let createData = {}
    let images = []
    let allTags = []

    allTags = req.body.tags.slice(1, req.body.tags.length - 1).split(',')

    const files = req.files

    const uploadPromises = files.map((file) => {
      const destinationPath = `post/create_by_${req.body.name}_${date.getDate()}${
        date.getUTCMonth() + 1
      }${date.getFullYear()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}${Math.floor(Math.random() * 10)}${file.originalname}`
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
        res.status(500).send('An error occurred while uploading the image.')
      })

      return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
          try {
            // Get the download URL of the uploaded file
            const downloadUrl = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-01-2500', // Set an appropriate expiration date
            })

            resolve(downloadUrl)
          } catch (error) {
            console.error('Error getting download URL:', error)
            reject(error)
          }
        })

        // Start uploading the file
        stream.end(fileBuffer)
      })
    })

    Promise.all(uploadPromises)
      .then(async (downloadUrls) => {
        downloadUrls.map((val) => {
          images.push(...val)
        })

        createData.name = req.body.name
        createData.username = req.body.username
        createData.author_id = req.body.author_id
        createData.imgAuthor = req.body.imgAuthor
        createData.title = req.body.title
        createData.desc = req.body.desc
        createData.images = images
        createData.tags = allTags
        createData.liked = []
        createData.num_comment = 0
        createData.date = date.toLocaleString()

        await db.collection('blocks').add(createData)

        allTags.map(async (val) => {
          tagRef = db.collection('tags').where('tags', '==', val)
          getTags = await tagRef.get()

          getTags.forEach(async (val) => {
            num_mention = val.data().num_mention + 1
            await db.collection('tags').doc(val.id).update({ num_mention: num_mention })
          })
        })

        res.status(200).json({ msg: 'success' })
      })
      .catch((error) => {
        console.error('Error uploading images:', error)
        res.status(500).send('An error occurred while uploading the images.')
      })
  } catch (error) {
    res.send(error)
  }
})

router.delete('/:block_id', middleware.checkToken, async (req, res) => {
  try {
    const { block_id } = req.params

    const dataUsers = await db.collection('users').where('liked', 'array-contains', block_id).get()

    const updatePromises = []
    dataUsers.forEach((val) => {
      if (val.id) {
        const userRef = db.collection('users').doc(val.id)
        const updatePromise = userRef.update({ liked: admin.firestore.FieldValue.arrayRemove(block_id) })
        updatePromises.push(updatePromise)
      }
    })

    await Promise.all(updatePromises)

    await db.collection('blocks').doc(block_id).delete()

    res.status(200).json({ msg: 'Data successfully deleted' })
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the data' })
  }
})

module.exports = router
