const basicAuth = require("basic-auth");
let secrets;

module.exports = function(req, res, next) {
    var creds = basicAuth(req);
    if (process.env.NODE_ENV == "production") {
        secrets = process.env;
    } else {
        secrets = require("./secrets");
    }

    if (
        !creds ||
        creds.name != secrets.CREDS_NAME ||
        creds.pass != secrets.CREDS_PASS
    ) {
        res.setHeader(
            "WWW-Authenticate",
            'Basic realm="Please enter username and password"'
        );
        res.sendStatus(401);
    } else {
        next();
    }
};
