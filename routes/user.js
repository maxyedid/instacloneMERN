const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const requiredLogin = require('../middleware/requiredLogin')
const Post = mongoose.model("Post")
const User = mongoose.model("User")

router.post('/search-users', (req,res) => {
    let userPattern = new RegExp("^" + req.body.query);
    User.find({email: {$regex: userPattern}}).select("_id email").then(user => res.json({user}))
    .catch(err => {
        console.log(err)
    })
})

router.get("/user/myprofile", requiredLogin, (req, res) => {
    User.findOne({_id: req.user._id}).select("-password").then(user => {
        Post.find({postedBy: req.user._id}).populate("postedBy", "_id name").exec((err, posts) => {
            if (err) {
                return res.status(422).json({error: err})
            }
            res.json({user, posts})
        })
    }).catch(err => {
        return res.status(404).json({error: "User not found"})
    })
})

router.get('/user/:id', (req, res) => {
    User.findOne({_id: req.params.id}).select("-password").then(user => {
        Post.find({postedBy: req.params.id}).populate("postedBy", "_id name").exec((err, posts) => {
            if (err) {
                return res.status(422).json({error: err})
            }
            res.json({user, posts})
        })
    }).catch(err => {
        return res.status(404).json({error: "User not found"})
    })
})

router.put("/follow", requiredLogin, (req, res) => {
    User.findByIdAndUpdate(req.body.followId, {
        $push: {followers: req.user._id}
    }, {new: true}, (err, result) => {
        if (err) {
           return res.status(422).json({error: err})
        }
        User.findByIdAndUpdate(req.user._id, {
            $push: {following: req.body.followId}
        }, {new:true}).select("-password").then(result => {
            res.json(result)
        }).catch(err => {
            return res.status(422).json({error: err})
        })
    })
})

router.put("/unfollow", requiredLogin, (req, res) => {
    User.findByIdAndUpdate(req.body.unfollowId, {
        $pull: {followers: req.user._id}
    }, {new: true}, (err, result) => {
        if (err) {
           return res.status(422).json({error: err})
        }
        User.findByIdAndUpdate(req.user._id, {
            $pull: {following: req.body.unfollowId}
        }, {new:true}).select("-password").then(result => {
            res.json(result)
        }).catch(err => {
            return res.status(422).json({error: err})
        })
    })
})

module.exports = router