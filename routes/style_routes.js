var router = require('express').Router()
const { db } = require('../firebase')
const middleware = require('../middleware')
const admin = require('firebase-admin')

router.post('/createFashionData', middleware.checkToken, async (req,res)=>{
    try{
        console.log(req.body)
        const fashionCollection = db.collection('fashion')
        await fashionCollection.add(req.body)
        res.status(200).json({
            msg:'success'
        })
    }catch(error){
        console.log(error)
        res.send(error)
    }
})

router.get('/showFashionData', async(req,res)=>{
    try {
        let allFashionData = []
        const getFashionCollection = await db.collection('fashion').get()
        getFashionCollection.forEach(val => {
            // console.log(val.data())
            allFashionData.push(val.data())
        });
        console.log(getFashionCollection)
        res.status(200).json({
            msg:'success',
            getAllData:allFashionData
        })
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

router.patch('/:fashionID', async(req,res)=>{
    try {
        const {fashionID} = req.params
        console.log(fashionID)
        const updateFashionData = await db.collection('fashion').doc(fashionID).update({...req.body})
        res.status(200).json({
            msg:'success',
    })
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

router.delete('/:fashionID', async(req,res)=>{
    try {
        const {fashionID} = req.params
        console.log(fashionID)
        const updateFashionData = await db.collection('fashion').doc(fashionID).delete()
        res.status(200).json({
            msg:'success',
    })
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

module.exports = router