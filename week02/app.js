const express = require('express');

const PORT = 3000;
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const posts = [
  { id: 1, title: 'Express 설치했어요', author: 'kim', content: 'npm install express 끝!' },
  { id: 2, title: '서버가 안 켜져요', author: 'lee', content: 'EADDRINUSE 에러가 나요' },
  { id: 3, title: 'EJS 질문', author: 'park', content: '<%= %> 랑 <%- %> 차이가 뭔가요?' },
];

/* --- functions --- */
function addPost(posts, title, author, content) {
	const maxid = posts.reduce((max, post) => Math.max(max, post.id), 0);
	const post = { id: maxid+1, title, author, content };
	posts.push(post);
	
	return post;
}

/* --- routes --- */
app.get('/', (req, res) => { res.redirect('/posts'); });

app.get('/posts', (req, res) => { 
	const { keyword } = req.query;
	
	// No query: show all
	if (keyword === undefined) { res.render('list', {posts: posts}); }
	
	// Has query: show specified posts with title includes keyword
	else {
		res.render('list', {
			posts: posts.filter((post) => post.title.includes(keyword))
		});
	}
	// console.log(keyword);
});

app.get('/posts/new', (req, res) => { res.render('new'); });

app.get('/posts/:id', (req, res) => {
	const id = Number(req.params.id);
	const post = posts.find((post) => post.id === id) ?? null;
	
	// render something
	if (!post) { return res.status(404).render('404'); }
	res.render('detail', {post});
});

app.get('/:not_exist_route', (req, res) => { return res.status(404).render('404'); }); 



app.post('/posts', (req, res) => {
	const { title, author, content } = req.body;
	
	// check if there is blank title => 400
	if (title.trim() !== '') {
		const post = addPost(posts, title, author, content);
		res.redirect(`/posts/${post.id}`);
	}
	
	return res.status(400).redirect('/posts/new');
});

app.post('/posts/:id/delete', (req, res) => {
	const id = Number(req.params.id);
	const index = posts.findIndex((post) => post.id === id);
	
	if (index !== -1) {
		posts.splice(index, 1);		
	}
	res.redirect('/posts');
});



app.listen(PORT, () => { console.log(`서버 실행 중: http://localhost:${PORT}`); });