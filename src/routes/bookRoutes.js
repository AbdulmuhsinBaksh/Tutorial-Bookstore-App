    import express from "express"
    import cloudinary from "../lib/cloudinary.js";
    import Book from "../models/Book.js";
    import protectRoute from "../middleware/auth.middleware.js";

    const router = express.Router();


    router.post("/", protectRoute, async (req, res) => {
        try{

            const {title, caption, rating, image} = req.body;

            if(!image || !title || !caption || !rating){
                return res.status(400).json({message: "Please Provide all Feilds"})
            }

            //upload image
            const uploadResponse = await cloudinary.uploader.upload(image);
            const imageURL = uploadResponse.secure_url


            //save to database
            const newbook = new Book({
                title,
                caption,
                rating,
                image: imageURL,
                user: req.user._id
            })

            await newbook.save()
            res.status(201).json(newbook)

        }
        catch(error)
        {
            console.log("Error in book creation", error)
            res.status(500).json({message: error.message})
        }
    })

    router.get("/", protectRoute, async (req, res) => {

        try {
            const page = req.query.page || 1;
            const limit = req.query.page || 5;
            const skip = (page-1)*limit


            const books = Book.find().sort({ createdAt: -1})
            .skip(skip)
            .limit(limit)
            .populate("user", "username profileImage")

            const totalBooks = await Book.countDocuments();

            res.send({
                books,
                currentPage: page,
                totalBooks,
                totalPages: Math.ceil(totalBooks/limit),
            })
            
        } catch (error) {
            console.log("Error in getting books", error)
            res.status(500).json({message: "Internal error"})
        }
    })

    router.delete("/:id", protectRoute, async (req, res) => {
        try {
            const book = await Book.findById(req.params.id)

            if(!book){
                return res.status(404).json({message: "Book not found"})

            }

            if(book.user.toString() !== req.user._id.toString())
            {
                return res.status(401).json({message: "Unathorized deletion"})
            }

            await book.deleteOne();

            //delete from cloudinary

            if(book.image && book.image.includes("cloudinary"))
            {
                try {
                    
                    const publicId = book.image.split("/").pop().split(".")[0];
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    console.log("error deleteing cloudinary image", error)
                }
            }

            res.json({message: "Book deleted successfully"})


        } catch (error) {
            console.log("Error in deleting books", error)
            res.status(500).json({message: "Internal error"})
        }
    })

    export default router;