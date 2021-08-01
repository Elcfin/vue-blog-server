const Router = require("koa-router");

const articles = require("./articles");
const infos = require("./infos");
const users = require("./users");

const router = new Router();

router.use("/articles", articles.routes(), articles.allowedMethods());
router.use("/infos", infos.routes(), infos.allowedMethods());
router.use("/users", users.routes(), users.allowedMethods());

module.exports = router;
