var nc = require('ncurses'),
          win = new nc.Window(),
          config = require('./config.js');
var data = {
    level:1,
    health:45,
    healthMax:50,
    exp: 16,
    expMax: 20,
    gold: 5,
    silver: 10,
    habits: [
        {name:'1 Hour Productive Work',up:1,down:0},
        {name:'Eat Healthy Meal',up:1,down:1},
        {name:'Junk food / soda',up:0,down:1},
        {name:'Use Personal Notebook',up:1,down:1},
        {name:'Visit Reddit / HN',up:0,down:1}
        ],
    daily: [
        {name:'Go to Gym',done:0},
        {name:'Clean Desk, no VM, etc',done:1},
        {name:'Floss',done:0},
        {name:'In Work Early',done:0},
        {name:'Weekly Summary',done:0},
        {name:'Record Summary',done:0}
        ],
    todos: [
        'Ring Insurance',
        'book ZQN -> AKL flight',
        'confirm all flights',
        'email caddy and mullin about stuff to do during the day',
        'Review IB',
        'Review IB Addendum',
        'Review ITM'],
    rewards: [
        { name: 'Leather Armor', 'price': 30, description: 'Helps with stuff'},
        { name: 'Sword 2', 'price': 25, description: 'Helps with stuff'},
        { name: 'potion', 'price': 25, description: 'Helps with stuff'}
        ]

}

updateHeader(win,'hi here', {pos:'right'});

win2 = new nc.Window(40,40);
win2.box();
win2.addstr('hi');
win2.refresh();

win.cursor(40,55);
win3 = new nc.Window(20,20);
win3.move(10,10);
win3.box();
win3.refresh();

function updateHeader(win, header, style) {
   var curx = win.curx, cury = win.cury;
   style = style || {};
   header = '' + header;
   win.cursor(0, 0);
   win.clrtoeol();
   if (style.attrs)
     win.attron(style.attrs);
   if (header.length > 0) {
     if (style.pos === 'center')
       win.centertext(0, header);
     else if (style.pos === 'right')
       win.addstr(0, win.width-(Math.min(header.length, win.width)), header, win.width);
     else
        win.addstr(header, win.width);
  }
   if (style.attrs)
     win.attroff(style.attrs);
    win.cursor(1,0);
    win.hline(nc.cols, nc.ACS.HLINE);
    win.refresh();
   win.cursor(cury, curx);
   win.refresh();
}
