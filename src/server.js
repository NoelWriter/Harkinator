const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 3001;

const configFile = __dirname + "/../config.json";

app.use(cors());
app.use(express.json());

// get config
app.get("/config", (req, res) => {
    let rawdata = fs.readFileSync(configFile);
    let results = JSON.parse(rawdata);

    res.json({ data: results });
});

// post config
app.post("/config", function (req, res) {
  if (req.body.hasOwnProperty('STOCK_FRACTION_DIGITS')) {
    req.body.STOCK_FRACTION_DIGITS = parseInt(req.body.STOCK_FRACTION_DIGITS);
  }

  if (req.body.hasOwnProperty('STOCK_MULTIPLIER_ABOVE_SELL')) {
    req.body.STOCK_MULTIPLIER_ABOVE_SELL = parseFloat(req.body.STOCK_MULTIPLIER_ABOVE_SELL);
  }

  if (req.body.hasOwnProperty('STOCK_AMOUNT')) {
    req.body.STOCK_AMOUNT = parseFloat(req.body.STOCK_AMOUNT);
  }

  if (req.body.hasOwnProperty('STOCK_PROFIT')) {
    req.body.STOCK_PROFIT = parseFloat(req.body.STOCK_PROFIT);
  }

  if (req.body.hasOwnProperty('STOCK_PROBE_AMOUNT')) {
    req.body.STOCK_PROBE_AMOUNT = parseFloat(req.body.STOCK_PROBE_AMOUNT);
  }

  if (req.body.hasOwnProperty('NUM_INSTANCES')) {
    req.body.NUM_INSTANCES = parseInt(req.body.NUM_INSTANCES);
  }

  if (req.body.hasOwnProperty('STOCK_BUY_UPPER_LIMIT')) {
    req.body.STOCK_BUY_UPPER_LIMIT = parseFloat(req.body.STOCK_BUY_UPPER_LIMIT);
  }

  if (req.body.hasOwnProperty('STOCK_BUY_LOWER_LIMIT')) {
    req.body.STOCK_BUY_LOWER_LIMIT = parseFloat(req.body.STOCK_BUY_LOWER_LIMIT);
  }

  if (req.body.hasOwnProperty('STOCK_BUY_FILL_WAIT')) {
    req.body.STOCK_BUY_FILL_WAIT = parseInt(req.body.STOCK_BUY_FILL_WAIT);
  }

  if (req.body.hasOwnProperty('STOCK_SELL_UPPER_LIMIT')) {
    req.body.STOCK_SELL_UPPER_LIMIT = parseFloat(req.body.STOCK_SELL_UPPER_LIMIT);
  }

  if (req.body.hasOwnProperty('STOCK_SELL_LOWER_LIMIT_BREAK_EVEN')) {
    req.body.STOCK_SELL_LOWER_LIMIT_BREAK_EVEN = parseFloat(req.body.STOCK_SELL_LOWER_LIMIT_BREAK_EVEN);
  }

  if (req.body.hasOwnProperty('STOCK_SELL_LOWER_LIMIT_LOSS')) {
    req.body.STOCK_SELL_LOWER_LIMIT_LOSS = parseFloat(req.body.STOCK_SELL_LOWER_LIMIT_LOSS);
  }

  if (req.body.hasOwnProperty('STOCK_EVALUATE_DELTA_UP')) {
    req.body.STOCK_EVALUATE_DELTA_UP = parseFloat(req.body.STOCK_EVALUATE_DELTA_UP);
  }

  if (req.body.hasOwnProperty('STOCK_EVALUATE_DELTA_DOWN')) {
    req.body.STOCK_EVALUATE_DELTA_DOWN = parseFloat(req.body.STOCK_EVALUATE_DELTA_DOWN);
  }

  if (req.body.hasOwnProperty('STOCK_LOSS_MULTIPLIER')) {
    req.body.STOCK_LOSS_MULTIPLIER = parseFloat(req.body.STOCK_LOSS_MULTIPLIER);
  }

  if (req.body.hasOwnProperty('FREEFALL_INDICATOR')) {
    req.body.FREEFALL_INDICATOR = parseFloat(req.body.FREEFALL_INDICATOR);
  }

  if (req.body.hasOwnProperty('STOCK_AVERAGE_ITERATIONS')) {
    req.body.STOCK_AVERAGE_ITERATIONS = parseInt(req.body.STOCK_AVERAGE_ITERATIONS);
  }

  if (req.body.hasOwnProperty('STOCK_AVERAGE_TIME_DELAY')) {
    req.body.STOCK_AVERAGE_TIME_DELAY = parseInt(req.body.STOCK_AVERAGE_TIME_DELAY);
  }

  if (req.body.hasOwnProperty('DELAY_PLATFORM_LAG')) {
    req.body.DELAY_PLATFORM_LAG = parseInt(req.body.DELAY_PLATFORM_LAG);
  }

  if (req.body.hasOwnProperty('DELAY_FREEFALL_DETECTED')) {
    req.body.DELAY_FREEFALL_DETECTED = parseInt(req.body.DELAY_FREEFALL_DETECTED);
  }

  if (req.body.hasOwnProperty('LAG_MAX_ORDER_DELAY')) {
    req.body.LAG_MAX_ORDER_DELAY = parseInt(req.body.LAG_MAX_ORDER_DELAY);
  }

  if (req.body.hasOwnProperty('LIVE_ACCOUNT_NUM')) {
    req.body.LIVE_ACCOUNT_NUM = parseInt(req.body.LIVE_ACCOUNT_NUM);
  }

  if (req.body.hasOwnProperty('STOCK_ROUND_TO_WHOLE')) {
    req.body.STOCK_ROUND_TO_WHOLE = req.body.STOCK_ROUND_TO_WHOLE === 'true' ? true : false; 
  }

  if (req.body.hasOwnProperty('FORCE_CLOSE_OPEN_POSITIONS')) {
    req.body.FORCE_CLOSE_OPEN_POSITIONS = req.body.FORCE_CLOSE_OPEN_POSITIONS === 'true' ? true : false; 
  }

  if (req.body.hasOwnProperty('DEMO_MODE')) {
    req.body.DEMO_MODE = req.body.DEMO_MODE === 'true' ? true : false; 
  }

  if (req.body.hasOwnProperty('HEADLESS')) {
    req.body.HEADLESS = req.body.HEADLESS === 'true' ? true : false; 
  }

  if (req.body.hasOwnProperty('TWO_FACT_AUTH')) {
    req.body.TWO_FACT_AUTH = req.body.TWO_FACT_AUTH === 'true' ? true : false; 
  }

  if (req.body.hasOwnProperty('DEBUG')) {
    req.body.DEBUG = req.body.DEBUG === 'true' ? true : false; 
  }

  fs.writeFile(configFile, JSON.stringify(req.body, null, 2), function writeJSON(error) {
      if (error) {
        return console.log(error);
      }

      res.json({ data: req.body });
    }
  );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
