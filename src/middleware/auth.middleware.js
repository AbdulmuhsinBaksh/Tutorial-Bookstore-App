import jwt from "jsonwebtoken"
import User from "../models/User.js"


const protectRoute = async(req, res, next) => {
    try {
        //get token
        const token = req.header("Authorization").replace("Bearer ", "");
        if (!token) {
          res.status(401).json({ message: "No Auth Token, access denied" });
        }

        const decoded = jwt.verify(process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
          res.status(401).json({ message: "token is invalid" });
        }


        req.user = user;
        next();

    } catch (error) {
        console.log("Error in Auth", error.message)
        res.status(401).json({message: "token is invalid"})
    }
}

export default protectRoute;