const express = require('express');

const app = express();
app.use(express.static('public'));

const PORT = 3000;

app.get('/', (req, res) => { res.send('<h1>Hello Express!</h1>'); });
app.get('/about', (req, res) => {
	res.send('<h1>HELLO!</h1><p>I\'m JS Lim.<br>Nice to meet you</p>');
});
app.get('/photo', (req, res) => {
	res.send('<img src="https://www.knu.ac.kr/wbbs/img/intro/new_ch_basic.png" />');
});
app.get('/time', (req, res) => {
	const now = new Date();
	const date = `${now.getFullYear()}-${(now.getMonth()+1)}-${now.getDate()}`
	const time = `${now.getHours()}:${(now.getMinutes())}:${now.getSeconds()}`
	
	res.send(`<h1>Current Time</h1><p>${date} ${time}</p>`);
});

app.listen(PORT, () => { console.log(`서버 실행 중: http://localhost:${PORT}`); });