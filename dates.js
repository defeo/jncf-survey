const start = exports.start = new Date(2020, 0, 6);

const range = (i, s=0) => Array(i).fill(0).map((_, x) => x+s);

const ords = exports.ords = range(50);//.concat(range(50, 52));

const dates = exports.dates = [];
for (let i of ords) {
  dates.push(new Date(start.getTime() + i * 1000 * 60 * 60 * 24 * 7)); 
}