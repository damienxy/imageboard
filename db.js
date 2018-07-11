const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/imageboard");

exports.getImages = function() {
    const q = `
        SELECT * FROM images
        ORDER BY created_at DESC
        LIMIT 12;
    `;
    return db.query(q);
};

exports.getMoreImages = function(smallestId) {
    const q = `
        SELECT * FROM images
        WHERE id < $1
        ORDER BY created_at DESC
        LIMIT 12;
    `;
    const params = [smallestId];
    return db.query(q, params);
};

exports.saveImage = function(title, descr, username, url) {
    const q = `
        INSERT INTO images (url, username, title, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id, url, title, description, username
    `;
    const params = [url, username || null, title || null, descr || null];
    return db.query(q, params);
};

exports.getImageById = function(id) {
    const q = `
    SELECT *, (
        SELECT id
        FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 1)
        as prev_id,
        (
        SELECT id FROM images
        WHERE id > $1
        ORDER BY id ASC
        LIMIT 1)
        as next_id
        FROM images
        WHERE id = $1;
    `;
    const params = [id];
    return db.query(q, params);
};

exports.getCommentsById = function(image_id) {
    const q = `
        SELECT * FROM comments
        WHERE image_id = $1
        ORDER BY created_at DESC;
    `;
    const params = [image_id];
    return db.query(q, params);
};

exports.saveComment = function(image_id, commenter, comment) {
    const q = `
        INSERT INTO comments (image_id, commenter, comment)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const params = [image_id || null, commenter || null, comment || null];
    return db.query(q, params);
};
