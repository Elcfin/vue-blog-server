const Router = require("koa-router");

const tags = require("./tags");
const articles = require("./articles");
const users = require("./users");

const router = new Router();

router.use("/tags", tags.routes(), tags.allowedMethods());
router.use("/articles", articles.routes(), articles.allowedMethods());
router.use("/users", users.routes(), users.allowedMethods());

module.exports = router;
