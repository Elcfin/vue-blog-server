const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Tag = require("../../../mongodb/models/Tag");
const Article = require("../../../mongodb/models/Article");

/*
 * @route GET api/tags/getTags
 * @desc 获取所有标签接口地址
 * @access 接口是私有的
 */
router.get(
  "/getTags",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const findResult = await Tag.find({});
    ctx.body = {
      success: true,
      tags: findResult,
    };
  }
);

/*
 * @route GET api/tags/getPublicTags
 * @desc 获取已发布标签接口地址
 * @access 接口是公开的
 */
router.get("/getPublicTags", async (ctx) => {
  const findResult = await Tag.find({});
  const tags = [];

  for (const tag of findResult) {
    const result = await Article.find({
      tags: { $elemMatch: { $eq: tag } },
      isPublished: true,
    });

    if (result.length) tags.push(tag);
  }

  ctx.body = {
    success: true,
    tags,
  };
});

/*
 * @route GET api/tags/filterTags
 * @desc 删除没有被使用的标签接口地址
 * @access 接口是公开的
 */
router.get("/filterTags", async (ctx) => {
  let tags = await Tag.find({});
  for (const tag of tags) {
    const result = await Article.find({
      tags: { $elemMatch: { $eq: tag } },
    });

    if (!result.length)
      await Tag.deleteOne({
        name: tag.name,
      });
  }

  tags = await Tag.find({});
  ctx.body = { success: true, tags };
});

module.exports = router;
