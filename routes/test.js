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
      console.log(file)

      const destinationPath = `profile/${user_id}_${date.getDate()}${
        date.getUTCMonth() + 1
      }${date.getFullYear()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}${Math.floor(Math.random() * 10)}${file.originalname}`

      const fileBuffer = file.buffer
      const contentType = file.mimetype

      const fileUpload = bucket.file(destinationPath)

      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: contentType,
        },
      })

      stream.on('error', (error) => {
        console.error('Error uploading image:', error)
        res.status(500).send('An error occurred while uploading the image.')
      })

      stream.on('finish', async () => {
        const imgAuthor = await fileUpload.getSignedUrl({
          action: 'read',
          expires: '03-01-2500',
        })
        console.log(imgAuthor)

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