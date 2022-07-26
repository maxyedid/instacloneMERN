const express = require('express')
const router = express.Router();
const mongoose = require('mongoose')
const User = mongoose.model("User");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {JWT_SECRET} = require('../config/keys')
const requireLogin = require('../middleware/requiredLogin');

router.get('/protected', requireLogin, (req, res) => {
    res.send("Ayoooooo my boyyyyyy")
})

router.post('/signup', (req, res) => {
    const {name, email, password, pic} = req.body;
    if (!email || !name || !password) {
        return res.status(422).json({error: "Please fill out all fields: Name, Email, Password"})
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(422).json({error: "Email is invalid"})
    }
    User.findOne({email: email}).then((savedUser) => {
        if (savedUser) {
            return res.status(422).json({error: "User already exists with that email"})
        }
        bcrypt.hash(password, 12).then(hashedPass => {

        
        const user = new User({
            email,
            password: hashedPass,
            name,
            pic
        })

        user.save().then(user => {
            res.json({message: "Account created successfully"});
        }).catch(err => {
            console.log(err);
        })
    })
    }).catch(err => {
        console.log(err);
    })
})

router.post('/signin', (req, res) => {
    const {email, password} = req.body
    if (!email || !password) {
        return res.status(422).json({error: "Please provide both email and password"})
    }

    User.findOne({email:email}).then(savedUser => {
        if (!savedUser) {
            return res.status(422).json({error: "Invalid email/password"})
        }
        bcrypt.compare(password, savedUser.password).then(doMatch => {
            if (!doMatch) {
                return res.status(422).json({error: "Invalid email/password"})
            }
           // res.status(200).json({message: "successfully signed in"})
           const token = jwt.sign({id: savedUser._id}, JWT_SECRET)
           const {_id, name, email, followers, following, pic} = savedUser
           res.json({token, user: {_id, name, email, followers, following, pic}});
        }).catch(err => {
            console.log(err);
        })
    })
})

module.exports = router;