const express = require('express')
const router = express.Router();
const mongoose = require('mongoose')
const requiredLogin = require('../middleware/requiredLogin')
const Post = mongoose.model("Post")

router.get('/allposts',  (req, res) => {
    Post.find().populate("postedBy", "_id name email").populate("comments.postedBy", "_id name").then(data => {
        res.json({posts: data})
    })
    .catch(err => {
        console.log(err);
    })
})

router.get('/getsubpost', requiredLogin, (req, res) => {
    Post.find({postedBy: {$in: req.user.following}}).populate("postedBy", "_id name email").populate("comments.postedBy", "_id name").then(data => {
        res.json({posts: data})
    })
    .catch(err => {
        console.log(err);
    })
})

router.post('/createPost', requiredLogin, (req, res) => {
    const {title, body, pic} = req.body
    if (!title || !body || !pic) {
        return res.status(422).json({error: "Please fill out all required fields"})
    }
    req.user.password = undefined;
    const post = new Post({
        title,
        body,
        photo : pic,
        postedBy: req.user
    })
    post.save().then(result => {
        res.json({post: result})
    }).catch(err => {
        console.log(err)
    }) 
})

router.get('/mypost', requiredLogin, (req, res) => {
    Post.find({postedBy: req.user._id}).populate("postedBy", "_id name").then(myData => {
        res.json({myData})
    }).catch(err => {
        console.log(err)
    })
})

router.put('/like', requiredLogin, (req, res) => {
    Post.findByIdAndUpdate(req.body.postId, {
        $push:{likes:req.user._id}
    }, {
        new: true
    }).populate("postedBy", "_id name").populate("comments.postedBy", "_id name").exec((err, result) => {
        if (err) {
            return res.status(422).json({error: err})
        }
        res.json(result)
    })
})

router.put('/unlike', requiredLogin, (req, res) => {
    Post.findByIdAndUpdate(req.body.postId, {
        $pull:{likes:req.user._id}
    }, {
        new: true
    }).populate("postedBy", "_id name").populate("comments.postedBy", "_id name").exec((err, result) => {
        if (err) {
            return res.status(422).json({error: err})
        }
        res.json(result)
    })
})

router.put('/comment', requiredLogin, (req, res) => {
    const comment = {
        text: req.body.text,
        postedBy: req.user._id
    }
    Post.findByIdAndUpdate(req.body.postId, {
        $push:{comments:comment}
    }, {
        new: true
    }).populate("postedBy", "_id name").populate("comments.postedBy", "_id name")
    .exec((err, result) => {
        if (err) {
            return res.status(422).json({error: err})
        }
        res.json(result)
    })

})
router.delete('/deletepost/:postId', requiredLogin, (req, res) => {
    Post.findOne({_id: req.params.postId}).populate("postedBy", "_id").exec((err,post) => {
        if (err || !post) {
            return res.status(422).json({err: err || "Post can't be found"})
        }
        if (post.postedBy._id.toString() === req.user._id.toString()) {
            post.remove().then(result => {
                res.json(result)
            }).catch(err => {
                console.log(err)
            })
        } 
    })
})
module.exports = router