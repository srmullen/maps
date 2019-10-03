const fs = require('fs');
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const pako = require('pako');
require('body-parser-xml')(bodyParser);

const PORT = 3500;
const app = express();

app.use(bodyParser.json({ limit: '10000kb' }));

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/tile', (req, res) => {
  const z = req.query.z;
  const x = req.query.x;
  const y = req.query.y;
  getTile(z, x, y).then(response => response.buffer()).then(buffer => {
    res.set({
      'Cache-Control': 'private, max-age=86400',
      'Content-Type': 'image/png'
    });
    res.send(buffer);
  }).catch(err => {
    res.status(404).send('Bad Request');
  });
});

app.put('/svg', (req, res) => {
  console.log("Putting SVG");
  const content = pako.inflate(req.body.content, { to: 'string' });
  fs.writeFile(`./svg/${req.body.name}.svg`, content, (err) => {
    if (err) {
      console.error(err);
    } else {
      res.send("Success");
    }
  });
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

function tileUrl(z, x, y) {
  return `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
}

function getTile(z, x, y) {
  return fetch(tileUrl(z, x, y));
}