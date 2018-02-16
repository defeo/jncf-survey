const $ = document.querySelector.bind(document);

$('#cal').addEventListener('click', function (e) {
  if (e.target.classList.contains('star')) {
    var star = e.target;
    var starset = e.target.parentElement;
    starset.querySelectorAll('.star').forEach(function(s) {
        s.classList.toggle('selected', s == star);
    });
  }
});

$('form').addEventListener('submit', function(e) {
  var btn = $('button');
  btn.disabled = true;
  
  var name = $('#name').value;
  var vote = {
    name: name,
    seed: (name == localStorage.name ? localStorage.seed : '') || Math.random().toString(36).substr(2),
    hmac: (name == localStorage.name ? localStorage.hmac : '') || '',
    choices: [],
  }
  document.querySelectorAll('#cal .star.selected').forEach(function(s) {
    vote.choices.push({
      vote: s.dataset.value,
      date: s.dataset.date,
    });
  });
  
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'vote');
  xhr.responseType = 'json';
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify(vote));
  xhr.onload = function() {
    console.log(xhr.response);
    if (xhr.response.ok) {
      localStorage.name = vote.name;
      localStorage.seed = vote.seed;
      localStorage.hmac = xhr.response.hmac;
      getVotes();
      alert(xhr.response.message);
    } else {
      alert('Error: ' + xhr.response.message);
    }
  }
  xhr.onloadend = function() {
    btn.disabled = false;
  }
  
  e.preventDefault();
  return false;
});

(function getMe() {
  if (localStorage.name && localStorage.seed && localStorage.hmac) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'me?name=' + localStorage.name);
    xhr.responseType = 'json';
    xhr.send()
    xhr.onload = function() {
      if (xhr.response.ok) {
        for (var v in xhr.response.vote) {
          if (v != 'name') {
            var starset = $('.stars[data-date="' + v + '"]');
            starset.querySelectorAll('.star').forEach(function(s) {
              s.classList.remove('selected');
            });
            var val = xhr.response.vote[v];
            starset.querySelector('[data-value="' + val + '"]').classList.add('selected');
          }
        }
        $('#name').value = localStorage.name;
      } else {
        console.error(xhr.response.message);
      }
    }
  }
})();

function getVotes() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'totals');
  xhr.responseType = 'json';
  xhr.send()
  xhr.onload = function() {
    if (xhr.response.ok) {
      var totals = xhr.response.totals[0]
      var tot = totals.cnt;
      for (var w in totals) {
        if (w != 'cnt') {
          var votebar = $('.vote[data-date="' + w + '"] .bar');
          var score = totals[w] - tot;
          votebar.style.width = (score / tot * 50) + '%';
          votebar.style.opacity = (score / tot / 2);
        }
      }
      var grades = xhr.response.bygrade;
      for (var i = 0; i < grades.length; i++) {
        if (grades[i].length) {
          var bar = $('.vote[data-date="' + grades[i][0].week + '"]');
          bar.title = 'Participants: ' + tot;
          for (var j = 0; j < grades[i].length; j++) {
            bar.title += '\n' + grades[i][j].stars + ' stars: ' + grades[i][j].cnt;
          }
        }
      }
    } else {
      console.error(xhr.reponse.message);
    }
  }
}
getVotes();

var feries =  ['2020-04-13', '2020-05-01', '2020-05-08', '2020-05-21',
               '2020-06-01', '2020-07-14', '2020-08-15', '2020-11-01',
               '2020-11-11'];
for (var i = 0; i < feries.length; i++) {
  $('.date[data-date="' + feries[i] + '"]').classList.add('weekend');
}

var vacs = [
  { start: Date.UTC(2020, 1, 1), last: 30 },
  { start: Date.UTC(2020, 3, 4), last: 30 },
  { start: Date.UTC(2020, 6, 4), last: 58 },
  { start: Date.UTC(2020, 9,17), last: 16 },
];
for (var i = 0; i < vacs.length; i++) {
  var v = vacs[i];
  for (var j = 0; j < v.last; j++) {
    var d = new Date(v.start + j*1000*60*60*24);
    $('.date[data-date="' + d.toISOString().substr(0,10) + '"]').classList.add('vacances');
  }
}
