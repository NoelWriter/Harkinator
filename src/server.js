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
  fs.writeFile(
    configFile,
    JSON.stringify(req.body, null, 2),
    function writeJSON(error) {
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
