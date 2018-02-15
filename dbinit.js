const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: ".data/db.sqlite3"
    },
    debug: true,
});

const dates = require('./dates');

(async function() {
  await knex.schema.dropTableIfExists('poll');

  await knex.schema.createTable('poll', (table) => {
    table.string('name').primary();
    for (let d of dates.dates)
      table.enum(d.toISOString().substr(0,10), [1,2,3]).defaultTo(2);
  });
})();
