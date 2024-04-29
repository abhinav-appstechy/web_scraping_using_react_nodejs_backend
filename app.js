const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { check, validationResult } = require("express-validator");
const cheerio = require("cheerio");
const cors = require("cors");

// define express app
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const URL = "https://www.amazon.com/s?k=smartphone";

app.post(
  "/find-products",
  [
    check("minPrice").isNumeric().withMessage("Must be a number"),
    check("maxPrice").isNumeric().withMessage("Must be a number"),
    
],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty){
        return res.status(400).json({
            status: "error",
            message: "Validation Error"
        })
    }

    const minPrice = req.body.minPrice;
    const maxPrice = req.body.maxPrice;

    const response = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
      },
    });
    const html = response.data;
    const $ = cheerio.load(html);
    // console.log("html",$.html());

    // Extract product names and prices
    const products = [];
    $('div[data-component-type="s-search-result"]').each((index, element) => {
      const produtImage = $(element)
        .find(
          'div[class="a-section aok-relative s-image-fixed-height"] > img[data-image-latency="s-product-image"]'
        )
        .attr("src");
      const productLink = $(element)
        .find(
          'a[class="a-link-normal s-underline-text s-underline-link-text s-link-style a-text-normal"]'
        )
        .attr("href");

      const productName = $(element)
        .find('span[class="a-size-medium a-color-base a-text-normal"]')
        .text()
        .trim();
      const priceText = $(element)
        .find('span[class="a-price"] > span[class="a-offscreen"]')
        .text()
        .trim();
      const price = parseFloat(priceText.replace("$", "").replace(",", ""));

      console.log(index);
      console.log(`productLink https://www.amazon.com${productLink}`);
      console.log("produtImage", produtImage);
      console.log("productName-", productName);
      console.log("price-", price);

      if (!isNaN(price) && price >= minPrice && price <= maxPrice) {
        products.push({
          image: produtImage,
          link: `https://www.amazon.com${productLink}`,
          name: productName,
          price: price,
        });
      }
    });

    res.status(200).json({
        status: "success",
        data: products
    })
  }
);

app.listen(5000, () => {
  console.log("Server is running at port http://localhost:5000");
});
