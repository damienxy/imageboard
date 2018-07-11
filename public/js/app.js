new Vue({
    el: "#main",
    data: {
        chooseImage: "Choose an image",
        error: "",
        imgFormInfo: {
            title: "",
            description: "",
            username: "",
            img: null
        },
        images: [],
        currentImageId: location.hash.slice(1),
        isActive: false,
        moreButton: true
    },
    methods: {
        toggleUpload: function() {
            this.isActive = !this.isActive;
            if (this.error != "") {
                this.error = "";
            }
        },
        moreImages: function() {
            var self = this;
            const lowestCurrentId = this.images[this.images.length - 1].id;
            axios
                .get("/moreimages/" + lowestCurrentId)
                .then(function(results) {
                    if (results.data.images.length < 12) {
                        self.moreButton = false;
                    }
                    self.images = [...self.images, ...results.data.images];
                })
                .catch(err => {
                    console.log("Error in axios.get '/moreimages/:id'", err);
                });
        },
        selectFile: function(e) {
            this.imgFormInfo.img = e.target.files[0];
            this.chooseImage = "1 file chosen";
            this.error = "";
        },
        uploadImage: function(e) {
            e.preventDefault();
            var fd = new FormData();
            fd.append("title", this.imgFormInfo.title);
            fd.append("description", this.imgFormInfo.description);
            fd.append("username", this.imgFormInfo.username);
            fd.append("file", this.imgFormInfo.img);

            axios
                .post("/upload", fd)
                .then(result => {
                    this.images.unshift(result.data.image);
                    this.imgFormInfo.title = "";
                    this.imgFormInfo.description = "";
                    this.imgFormInfo.username = "";
                    this.chooseImage = "Choose an image";
                    this.error = "";
                })
                .catch(err => {
                    console.log("error in axios.post '/upload'", err);
                    this.error = err.response.data.message;
                    this.chooseImage = "Choose an image";
                });
        },
        openModal: function(e) {
            this.currentImageId = e;
        },
        closeModal: function() {
            location.hash = "";
        }
    },
    mounted: function() {
        var self = this;
        axios
            .get("/images")
            .then(function(resp) {
                self.images = resp.data.images;
            })
            .catch(err => {
                console.log("Error in axios.get '/images'", err);
            });
        addEventListener("hashchange", function() {
            self.currentImageId = location.hash.slice(1);
        });
    }
});

Vue.component("image-modal", {
    data: function() {
        return {
            currentImage: {},
            commentForm: {
                commenter: "",
                comment: ""
            },
            comments: [],
            errorComment: ""
        };
    },
    props: ["id"],
    methods: {
        closeMe: function() {
            this.$emit("close");
        },
        submitComment: function(e) {
            e.preventDefault();
            var self = this;
            axios
                .post("/comments", {
                    image_id: self.id,
                    commenter: self.commentForm.commenter,
                    comment: self.commentForm.comment
                })
                .then(result => {
                    self.comments.unshift(result.data.newComment);
                    self.commentForm.commenter = "";
                    self.commentForm.comment = "";
                    self.errorComment = "";
                })
                .catch(err => {
                    console.log("error in axios.post '/upload'", err);
                    this.errorComment = err.response.data.message;
                });
        },
        getImageData: function() {
            var self = this;
            axios
                .get("/image/" + this.id)
                .then(function(results) {
                    self.currentImage = results.data.currentImage;
                    self.errorComment = "";
                })
                .catch(err => {
                    console.log("Error in axios.get '/image/:id'", err);
                });
            axios
                .get("/comments/" + this.id)
                .then(function(results) {
                    self.comments = results.data.comments;
                })
                .catch(err => {
                    console.log("Error in axios.get '/comments'", err);
                });
        }
    },
    watch: {
        id: function() {
            this.getImageData();
        }
    },
    template: "#image-modal-template",
    mounted: function() {
        this.getImageData();
    }
});
