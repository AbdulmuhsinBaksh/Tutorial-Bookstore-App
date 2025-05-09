import express from 'express'
import User from '../models/User.js';
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) =>
{
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"});
}
router.post("/register", async (req, res) => {
    try{
        const {email,username,password} = req.body;
        if(!email || !username || !password){
            return res.status(400).json({message: "All Feilds Are Required"})
        }

        if(password.length < 6){
            return res.status(400).json({message: "Password must be atleast 6 chars long"})
        }

        if(username.length < 3){
            return res.status(400).json({message: "Username must be atleast 3 chars long"})
        }

        //check if email and suername are already in use.
        const existingEmail = await User.findOne({$or:[{email}]});
        if(existingEmail)
        {
            return res.status(400).json({message: "User with that Email already exists"})
        }

        const existingUser = await User.findOne({$or:[{username}]});
        if(existingUser)
        {
            return res.status(400).json({message: "User with that Username already exists"})
        }

        //get random avatar
        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        //making a user

        const user = new User({
            email, 
            username, 
            password, 
            profileImage
        })

        await user.save()

        const token = generateToken(user._id);
        res.status(201).json({
            token, 
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            }
        })
    }
    catch(error){
        console.log("Error in register route", error)
        res.status(500).json({message: "Internal Server Error"})
  
    }
});
router.post("/login", async (req, res) => {
    try{

        const {email, password} = req.body
        if(!email || !password)
        {
            return res.status(400).json({message: "All Feilds are required"})
        }

        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message: "Invalid Credentials"})
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if(!isPasswordCorrect){
            return res.status(400).json({message: "Invalid Credentials"})
        }

        const token = generateToken(user._id);
        res.status(201).json({
            token, 
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            }
        })        
    }
    catch(error)
    {
        console.log("Error in login route", error)
        res.status(500).json({message: "Internal Server Error"})
    }
});

export default router;