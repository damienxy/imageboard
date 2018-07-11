const express = require("express");
const app = express();
const multer = require("multer");
const uidSafe = require("uid-safe");
const path = require("path");
const db = require("./db");
const s3 = require("./s3");
const config = require("./config");
const bodyParser = require("body-parser");
// const auth = require("./auth");

// ********** START Configuration of discStorage ********** //
const diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function(req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});
// ********** END Configuration of discStorage ********** //

// ********** START Image uploader ********** //
const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152
    }
});

const upload = uploader.single("file");
// ********** END Image uploader ********** //

// Middleware

app.use((req, res, next) => {
    if (
        process.env.NODE_ENV == "production" &&
        !req.headers["x-forwarded-proto"].startsWith("https")
    ) {
        return res.redirect(`https://${req.hostname}${req.url}`);
    } else {
        next();
    }
});

// Basic authentication (deactivated while in production)
// app.use(auth);

app.use(bodyParser.json());

app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

app.use(express.static("./public"));

// Routes

app.get("/images", (req, res) => {
    db
        .getImages()
        .then(function(results) {
            res.json({
                images: results.rows
            });
        })
        .catch(function(err) {
            console.log("Error in app.get('/images'): ", err);
        });
});

app.get("/moreimages/:id", (req, res) => {
    db
        .getMoreImages(req.params.id)
        .then(function(results) {
            res.json({
                images: results.rows
            });
        })
        .catch(function(err) {
            console.log("Error in app.get('/moreimages/:id'): ", err);
        });
});

app.post(
    "/upload",
    (req, res, next) => {
        upload(req, res, function(err) {
            if (err) {
                res.status(400).send({
                    message: err.message
                });
                return;
            }
            next();
        });
    },
    s3.upload,
    (req, res) => {
        db
            .saveImage(
                req.body.title,
                req.body.description,
                req.body.username,
                config.s3Url + req.file.filename
            )
            .then(function(results) {
                res.json({
                    image: results.rows[0]
                });
            })
            .catch(function(err) {
                console.log("Error in app.post('/upload'): ", err);
                if (err.code == 23502) {
                    res.status(500).send({
                        message: "Fields cannot be empty"
                    });
                } else if (err.code == 22001) {
                    res.status(500).send({
                        message: "Title or username too long"
                    });
                } else {
                    res.status(500).send({
                        message: "Upload failed"
                    });
                }

                res.status(500).send({
                    message: "Error"
                });
            });
    }
);

app.get("/image/:id", (req, res) => {
    db
        .getImageById(req.params.id)
        .then(function(results) {
            res.json({
                currentImage: results.rows[0]
            });
        })
        .catch(function(err) {
            console.log("Error in app.get('/image/", req.params.id, "')", err);
        });
});

app.get("/comments/:id", (req, res) => {
    db
        .getCommentsById(req.params.id)
        .then(function(results) {
            res.json({
                comments: results.rows
            });
        })
        .catch(function(err) {
            console.log("Error in app.get('/comments')", err);
        });
});

app.post("/comments", (req, res) => {
    db
        .saveComment(req.body.image_id, req.body.commenter, req.body.comment)
        .then(function(results) {
            res.json({
                newComment: results.rows[0]
            });
        })
        .catch(function(err) {
            console.log("Error in app.post('/comments')", err);
            if (err.code == 23502) {
                res.status(500).send({
                    message: "Fields cannot be empty"
                });
            } else if (err.code == 22001) {
                res.status(500).send({
                    message: "Comment too long"
                });
            } else {
                res.status(500).send({
                    message: "Please try again"
                });
            }
        });
});

app.listen(8080, () => console.log("Listening on 8080"));

// sub query (see slack) and then make the arrows to be href to prev and next id
