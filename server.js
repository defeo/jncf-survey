const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const crypto = require('crypto');

app.use(bodyParser.json());

const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: ".data/db.sqlite3"
    },
    debug: true,
});

const dates = require('./dates');

app.get('/', (req, res) => {
  res.render('cal.pug', dates);
});

app.get('/style.css', (req, res) => res.sendFile(__dirname + '/style.css'));
app.get('/cal.js', (req, res) => res.sendFile(__dirname + '/cal.js'));

app.post('/vote', async (req, res) => {
  if (!req.body.name) {
    res.status(400).json({ 'ok': false, 'message': 'Name not given' });
    return;
  }
  if (!req.body.seed) {
    res.status(400).json({ 'ok': false, 'message': 'Missing random seed' });
    return;
  }
  
  // Get vote data
  const data = { name: req.body.name };
  Object.assign(data, ...dates.dates.map((d) => ({ [d.toISOString().substr(0,10)] : 1 })));
  try {
    for (let c of req.body.choices) {
      data[c.date.substr(0,10)] = parseInt(c.vote);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ 'ok': false, 'message': 'Malformed data' });
    return;
  }

  // If this is a creation
  if (!req.body.hmac) {
    try {
      await knex('poll').insert(data);
    } catch (err) {
      if (err.errno == 19) {
        res.status(400).json({ 'ok': false, 'message': 'Name already taken' });
      } else {
        console.log(err);
        res.status(400).json({ 'ok': false, 'message': 'Malformed data' });
      }
      return;
    }
    const hmac = crypto.createHmac('sha256', process.env.SECRET);
    hmac.update(data.name + req.body.seed);
    res.json({ 'ok': true, 'hmac': hmac.digest('base64'), 'message': 'Thank you for casting your vote' });
  } else {
    const hmac = crypto.createHmac('sha256', process.env.SECRET);
    hmac.update(data.name + req.body.seed);
    if (req.body.hmac != hmac.digest('base64')) {
      res.status(403).json({ 'ok': false, 'message': 'Wrong credentials' });
      return;
    }
    try {
      await knex('poll').update(data).where('name', data.name);
    } catch (err) {
      console.log(err);
      res.status(400).json({ 'ok': false, 'message': 'Malformed data' });
      return;
    }
    res.json({ 'ok': true, 'hmac': req.body.hmac, 'message': 'Thank you for updating your vote' });
  }
});

app.get('/me', async (req, res) => {
  var me = await knex('poll').where('name', req.query.name);
  if (me.length == 1) {
    res.send({ 'ok': true, vote: me[0] });
  } else {
    res.status(404).send({ 'ok': false, 'message': 'Not found' });
  }
});

app.get('/totals', async (req, res) => {
  var totals = await dates.dates.reduce((q, d) => {
    var c = d.toISOString().substr(0,10);
    return q.sum(c + ` as ${c}`);
  }, knex('poll').count('* as cnt'));
  var grades = await Promise.all(dates.dates.map((d) => {
    let c = d.toISOString().substr(0,10);
    return knex('poll').groupBy(c)
      .select(c + ' as stars')
      .select(knex.raw(`(select '${c}') as week`))
      .count('* as cnt');
  }));
  res.json({ 'ok': true, totals: totals, bygrade: grades });
});

const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
