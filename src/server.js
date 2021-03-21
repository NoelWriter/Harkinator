const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 3001;

const configFile = __dirname + "/config/config.json";

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
