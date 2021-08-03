const mongoose = require("mongoose");
const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Article = require("../../../mongodb/models/Article");
const Tag = require("../../../mongodb/models/Tag");

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

    const newArticle = new Article({
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
    ctx.body = result;
  }
);

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

    ctx.body = result;
  }
);

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
    ctx.body = result;
  }
);

router.post(
  "/toDraftArticle",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const req = ctx.request.body;
    const _id = mongoose.Types.ObjectId(req._id);
    const result = await Article.findOneAndUpdate(
      {
        _id,
      },
      {
        $set: { isPublished: false },
      }
    );

    ctx.body = result;
  }
);

router.post(
  "/toPublicArticle",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const req = ctx.request.body;
    const _id = mongoose.Types.ObjectId(req._id);
    const result = await Article.findOneAndUpdate(
      {
        _id,
      },
      {
        $set: { isPublished: true },
      }
    );

    ctx.body = result;
  }
);

router.post("/getArticle", async (ctx) => {
  const req = ctx.request.body;
  const _id = mongoose.Types.ObjectId(req.id);
  const findResult = await Article.find({ _id }).populate("tags", ["name"]);

  ctx.body = findResult;
});

/* 通过标签筛选首页文章 */
router.post(
  "/filterHomeArticle",

  async (ctx) => {
    const req = ctx.request.body;
    const tags = req;

    if (!tags.length) {
      const articles = await Article.find({}).populate("tags", ["name"]);
      ctx.body = articles;
      return;
    }

    const filter = [];
    for (const tag of tags) {
      filter.push({ tags: { $elemMatch: { $eq: tag } } });
    }

    const articles = await Article.find({
      $and: filter,
    }).populate("tags", ["name"]);

    ctx.body = articles;
  }
);

/* all */
router.post("/getPageNumber", async (ctx) => {
  const req = ctx.request.body;
  const tags = req.tags;

  let articleNumber;
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

  ctx.body = { articleNumber, pageNumber, size };
});

router.post("/paging", async (ctx) => {
  const articleNumber = await Article.find({ isPublished: true }).count();
  const req = ctx.request.body;
  const tags = req.tags;
  /* 当前页数 */
  const page = parseInt(req.page);
  /* 每页显示数目 */
  const size = parseInt(req.size);

  const skip = (page - 1) * size;

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

  ctx.body = { hasMore, articles: result, articleNumber };
});

/* draft */
router.post("/getDraftPageNumber", async (ctx) => {
  const draftNumber = await Article.find({
    isPublished: false,
  }).count();
  const req = ctx.request.body;
  /* 每页显示数目 */
  const size = parseInt(req.size);
  const draftPageNumber = draftNumber ? Math.ceil(draftNumber / size) : 1;

  ctx.body = { draftNumber, draftPageNumber, size };
});

router.post("/draftPaging", async (ctx) => {
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

  ctx.body = { hasMore, drafts: result, draftNumber };
});

/* public */
router.post("/getPublicPageNumber", async (ctx) => {
  const publicNumber = await Article.find({
    isPublished: true,
  }).count();
  const req = ctx.request.body;
  /* 每页显示数目 */
  const size = parseInt(req.size);
  const publicPageNumber = publicNumber ? Math.ceil(publicNumber / size) : 1;

  ctx.body = { publicNumber, publicPageNumber, size };
});

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

  ctx.body = { hasMore, publics: result, publicNumber };
});

module.exports = router;
