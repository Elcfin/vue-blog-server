const mongoose = require("mongoose");
const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Article = require("../../../mongodb/models/Article");
const Tag = require("../../../mongodb/models/Tag");

/*
 * @route POST api/articles/createArticle
 * @desc 创建新文章接口地址
 * @access 接口是私有的
 */
router.post(
  "/createArticle",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const newArticleInfo = ctx.request.body;
    const title = newArticleInfo.title;
    const abstract = newArticleInfo.abstract;
    const content = newArticleInfo.content;
    const createTime = new Date();
    const lastEditTime = new Date();
    const tagsName = JSON.parse(newArticleInfo.tags);
    const isPublished = false;
    const tags = [];

    /* 如果标签还未创建，创建新标签 */
    for (const name of tagsName) {
      if (name === "") continue;
      const tag = await Tag.find({
        name,
      });

      if (!tag.length) {
        const newTag = await new Tag({
          name,
        });
        await newTag.save();
        tag.push(newTag);
      }

      tags.push(tag[0]);
    }

    if (title === "") {
      ctx.throw(400, "title is ''");
    }

    if (content === "") {
      ctx.throw(400, "content is ''");
    }

    const newArticle = await new Article({
      title,
      abstract,
      content,
      createTime,
      lastEditTime,
      tags,
      isPublished,
    });

    let result = await newArticle.save();
    await Article.populate(result, { path: "tags" }, (err, res) => {
      try {
        result = res;
      } catch (e) {
        console.log(e);
      }
    });
    ctx.body = { success: true, articles: result };
  }
);

/*
 * @route POST api/articles/deleteArticle
 * @desc 删除文章接口地址
 * @access 接口是私有的
 */
router.post(
  "/deleteArticle",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const req = ctx.request.body;
    const _id = mongoose.Types.ObjectId(req._id);
    const result = await Article.deleteOne({
      _id,
    });

    /*     const result = await Article.deleteMany({
      tags: { $elemMatch: { $eq: null } },
    }); */

    ctx.body = { success: true, result };
  }
);

/*
 * @route POST api/articles/updateArticle
 * @desc 更新文章接口地址
 * @access 接口是私有的
 */
router.post(
  "/updateArticle",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const newArticleInfo = ctx.request.body;
    const title = newArticleInfo.title;
    const abstract = newArticleInfo.abstract;
    const content = newArticleInfo.content;
    const lastEditTime = new Date();
    const tagsName = JSON.parse(newArticleInfo.tags);
    const isPublished = newArticleInfo.isPublished;
    const _id = mongoose.Types.ObjectId(newArticleInfo._id);
    const tags = [];

    for (const name of tagsName) {
      if (name === "") continue;
      const tag = await Tag.find({
        name,
      });

      if (!tag.length) {
        const newTag = await new Tag({
          name,
        });
        await newTag.save();
        tag.push(newTag);
      }
      tags.push(tag[0]);
    }

    if (title === "") {
      ctx.throw(400, "title is ''");
    }

    if (content === "") {
      ctx.throw(400, "content is ''");
    }

    const data = { title, abstract, content, lastEditTime, tags, isPublished };
    const result = await Article.findOneAndUpdate({ _id }, { $set: data });
    ctx.body = { success: true, article: result };
  }
);

/*
 * @route POST api/article/toDraftArticle
 * @desc 公开文章转移至草稿箱接口地址
 * @access 接口是私有的
 */
router.post(
  "/toDraftArticle",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const req = ctx.request.body;
    const _id = mongoose.Types.ObjectId(req._id);
    const result = await Article.findOneAndUpdate(
      { _id },
      { $set: { isPublished: false } }
    );

    ctx.body = { success: true, article: result };
  }
);

/*
 * @route POST api/article/toPublicArticle
 * @desc 草稿箱文章转移至已发布接口地址
 * @access 接口是私有的
 */
router.post(
  "/toPublicArticle",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const req = ctx.request.body;
    const _id = mongoose.Types.ObjectId(req._id);
    const result = await Article.findOneAndUpdate(
      { _id },
      { $set: { isPublished: true } }
    );

    ctx.body = {
      success: true,
      article: result,
    };
  }
);

/*
 * @route POST api/articles/getArticle
 * @desc 获取文章信息接口地址
 * @access 接口是公开的
 */
router.post("/getArticle", async (ctx) => {
  const req = ctx.request.body;
  const _id = mongoose.Types.ObjectId(req.id);
  const findResult = await Article.find({ _id }).populate("tags", ["name"]);

  ctx.body = {
    success: true,
    article: findResult[0],
  };
});

/*
 * @route POST api/articles/getPageNumber
 * @desc 获取首页文章分页数接口地址
 * @access 接口是公开的
 */
router.post("/getPageNumber", async (ctx) => {
  const req = ctx.request.body;
  const tags = req.tags;

  let articleNumber;
  /* 标签筛选 */
  if (tags.length) {
    const filter = [{ isPublished: true }];
    for (const tag of tags) {
      filter.push({ tags: { $elemMatch: { $eq: tag } } });
    }
    articleNumber = await Article.find({
      $and: filter,
    }).count();
  } else {
    /* 先按时间逆序排序 */
    articleNumber = await Article.find({ isPublished: true }).count();
  }

  /* 每页显示数目 */
  const size = parseInt(req.size);
  const pageNumber = articleNumber ? Math.ceil(articleNumber / size) : 1;

  ctx.body = { success: true, articleNumber, pageNumber, size };
});

/*
 * @route POST api/articles/paging
 * @desc 获取分页后首页文章接口地址
 * @access 接口是公开的
 */
router.post("/paging", async (ctx) => {
  const articleNumber = await Article.find({ isPublished: true }).count();
  const req = ctx.request.body;
  const tags = req.tags;
  /* 当前页数 */
  const page = parseInt(req.page);
  /* 每页显示数目 */
  const size = parseInt(req.size);
  const skip = (page - 1) * size;

  /* 先标签筛选 */
  let result;
  if (tags.length) {
    const filter = [{ isPublished: true }];
    for (const tag of tags) {
      filter.push({ tags: { $elemMatch: { $eq: tag } } });
    }

    result = await Article.find({
      $and: filter,
    })
      .populate("tags", ["name"])
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(size);
  } else {
    /* 先按时间逆序排序 */
    result = await Article.find({ isPublished: true })
      .populate("tags", ["name"])
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(size);
  }
  const hasMore = articleNumber - page * size > 0;
  ctx.body = { success: true, hasMore, articles: result, articleNumber };
});

/*
 * @route POST api/articles/getDraftPageNumber
 * @desc 获取草稿箱文章分页数接口地址
 * @access 接口是私有的
 */
router.post(
  "/getDraftPageNumber",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const draftNumber = await Article.find({
      isPublished: false,
    }).count();
    const req = ctx.request.body;
    /* 每页显示数目 */
    const size = parseInt(req.size);
    const draftPageNumber = draftNumber ? Math.ceil(draftNumber / size) : 1;

    ctx.body = { success: true, draftNumber, draftPageNumber, size };
  }
);

/*
 * @route POST api/articles/draftPaging
 * @desc 获取分页后草稿箱文章接口地址
 * @access 接口是私有的
 */
router.post(
  "/draftPaging",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const draftNumber = await Article.find({
      isPublished: false,
    }).count();
    const req = ctx.request.body;
    /* 当前页数 */
    const page = parseInt(req.page);
    /* 每页显示数目 */
    const size = parseInt(req.size);

    const skip = (page - 1) * size;

    /* 先按时间逆序排序 */
    const result = await Article.find({
      isPublished: false,
    })
      .populate("tags", ["name"])
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(size);
    const hasMore = draftNumber - page * size > 0;

    ctx.body = { success: true, hasMore, drafts: result, draftNumber };
  }
);

/*
 * @route POST api/articles/getPublicPageNumber
 * @desc 获取已发布文章分页数接口地址
 * @access 接口是公开的
 */
router.post("/getPublicPageNumber", async (ctx) => {
  const publicNumber = await Article.find({
    isPublished: true,
  }).count();
  const req = ctx.request.body;
  /* 每页显示数目 */
  const size = parseInt(req.size);
  const publicPageNumber = publicNumber ? Math.ceil(publicNumber / size) : 1;

  ctx.body = { success: true, publicNumber, publicPageNumber, size };
});

/*
 * @route POST api/articles/publicPaging
 * @desc 获取分页后已发布文章接口地址
 * @access 接口是公开的
 */
router.post("/publicPaging", async (ctx) => {
  const publicNumber = await Article.find({
    isPublished: true,
  }).count();
  const req = ctx.request.body;
  /* 当前页数 */
  const page = parseInt(req.page);
  /* 每页显示数目 */
  const size = parseInt(req.size);

  const skip = (page - 1) * size;

  /* 先按时间逆序排序 */
  const result = await Article.find({
    isPublished: true,
  })
    .populate("tags", ["name"])
    .sort({ createTime: -1 })
    .skip(skip)
    .limit(size);
  const hasMore = publicNumber - page * size > 0;

  ctx.body = { success: true, hasMore, publics: result, publicNumber };
});

module.exports = router;
