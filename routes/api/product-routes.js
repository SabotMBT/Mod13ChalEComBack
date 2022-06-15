const router = require("express").Router();
const { Product, Category, Tag, ProductTag } = require("../../models");

// The `/api/products` endpoint

// get all products
router.get("/", async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  try {
    const prodData = await Product.findAll({
      include: [{ model: Category }, { model: Tag }],
    });
    res.status(200).json(prodData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get("/:id", async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  try {
    const prodData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag }],
    });

    if (!prodData) {
      res.status(404).json({ message: "No Product found with this id!" });
      return;
    }

    res.status(200).json(prodData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post("/", async (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  try {
    const newProduct = await Product.create(req.body);
    if (req.body.tagIds.length) {
      const tagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: newProduct.id,
          tag_id,
        };
      });
      const prodTagId = await ProductTag.bulkCreate(tagIdArr);
      res.status(200).json(prodTagId);
    } else {
      res.status(200).json(newProduct);
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

// update product
router.put("/:id", async (req, res) => {
  // update product data
  try {
    const newProdData = await Product.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    // find all associated tags from ProductTag
    const prodTag = await ProductTag.findAll({
      where: { product_id: req.params.id },
    });
    if (prodTag) {
      // get list of current tag_ids
      const prodTagIds = await prodTag.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !prodTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = prodTag
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      const updateData = await Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
      res.status(200).json(updateData);
    } else {
      res.status(200).json(newProdData);
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

router.delete("/:id", async (req, res) => {
  // delete one product by its `id` value
  try {
    const prodData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (!prodData) {
      res.status(404).json({ message: "No Product with this id!" });
      return;
    }
    res.status(200).json(prodData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
