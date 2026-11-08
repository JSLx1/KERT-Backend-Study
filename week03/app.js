// init setting
const PORT = 3000;

const bcrypt = require('bcryptjs');

const express = require('express');
const session = require('express-session');
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(session({
	secret: 'kert-week03-secret', /* In real project, of course, secret MUST BE HIDDEN */
	resave: false, saveUninitialized: false,
}));
app.use((req, res, next) => {
	res.locals.user = req.session.user ?? null; 
	next();
});


const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('board.db'); 			// (CREATE if not exist AND) OPEN 'board.db'


// CREATE two tables
db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id       INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		role     TEXT NOT NULL DEFAULT 'user' 
	);
	CREATE TABLE IF NOT EXISTS posts (
		id      INTEGER PRIMARY KEY AUTOINCREMENT,
		title   TEXT NOT NULL,
		content TEXT NOT NULL,
		user_id INTEGER NOT NULL  -- foreign key
	);
`);

//

// ------ middle Functions ------
function requireLogin(req, res, next) {
	if (!req.session.user) { return res.redirect('/login'); }
	next();
}
function requireAdmin(req, res, next) {
	if (!req.session.user || req.session.user.role !== 'admin') { 
		return res.status(403).send('관리자만 볼 수 있습니다');
	}
	next();
}


// ------ routers ------
// ------ routers for admin ------
app.get('/admin', requireAdmin, (req, res) => {
	const users = db.prepare('SELECT id, username, role FROM users ORDER BY id')
					.all();
	res.render('admin', { users });
});

// ------ routers: auth ------
/* give signup page */
app.get('/signup', (req, res) => {
	res.render('signup', {error: null});
});

/* handle signup request */
app.post('/signup', (req, res) => {
	const { username, password } = req.body;
	
	// reject request with blank input
	if (username.trim() === '' || password.trim() === '') {
		return res.status(400).redirect('/signup');
	}
	
	// check if username is already exist
	const exists = db.prepare(`
		SELECT id 		
		FROM users as u 
		WHERE u.username = ?`).get(username);
	if (exists) { return res.render('signup', { error: '이미 있는 아이디입니다'}); }
	
	// hashing pw
	const hash = bcrypt.hashSync(password, 10);
	
	// add user data in DB
	db.prepare(`
		INSERT INTO users (username, password)
				   VALUES (?, ?)`).run(username, hash);
	
	res.redirect('/login');
});

/* give login page */
app.get('/login', (req, res) => {
	res.render('login', {error: null});
});

/* handle login request */
app.post('/login', (req, res) => {
	const { username, password } = req.body;
	
	// compare with user info in DB
	const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
	if (!user || !bcrypt.compareSync(password, user.password)) {
		return res.render('login', {error: '아이디 또는 비밀번호가 틀렸습니다'});
	}
	
	// give session to client
	req.session.user = {
		id: user.id, username: user.username, role: user.role
	};
	
	// redirect
	res.redirect('/posts');
});

/* handle logout request */
app.post('/logout', (req, res) => {
	// remove session
	req.session.destroy(() => {
		res.redirect('/posts');
	});
});

// ------ routers: about posts ------
/* give post lists page */
app.get('/posts', (req, res) => {
	const posts = db.prepare(`
		SELECT posts.id, posts.title, users.username
		FROM posts JOIN users ON posts.user_id = users.id  -- join two tables
		ORDER BY posts.id
	`).all();
	res.render('list', { posts });
});

/* give writing post page */
app.get('/posts/new', requireLogin, (req, res) => {
	res.render('new');
});

/* give detail post page */
app.get('/posts/:id', (req, res) => {
	const id = Number(req.params.id);  				// make sure 'id' be pure number
	const post = db.prepare(`
		SELECT p.id, p.title, p.content, p.user_id, u.username 
		FROM posts as p, users as u 
		WHERE p.id = ? AND u.id = p.user_id`).get(id);
	if (!post) return res.status(404).send('글이 없습니다');
	
	res.render('detail', { post }); 				// show
});

/* give writing post page */
app.post('/posts', requireLogin, (req, res) => {
	// save post in DB
	const { title, content } = req.body;
	
	// reject request with blank title
	if (title.trim() === '') {
		return res.status(400).redirect('/posts/new');
	}
	
	const result = db.prepare('INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)')
					 .run(title, content, req.session.user.id);
	
	res.redirect(`/posts/${result.lastInsertRowid}`);
});

/* handle delete request */
app.post('/posts/:id/delete', requireLogin, (req, res) => {
	const id = Number(req.params.id);  				// make sure 'id' be pure number
	
	// check if there is no finding post
	const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);
	if (!post) return res.status(404).send('글이 없습니다');
	
	// check permission
	const me = req.session.user;
	if (post.user_id !== me.id && me.role !== 'admin') {
		return res.status(403).send('내 글만 삭제할 수 있습니다');
	}
	
	db.prepare('DELETE FROM posts WHERE id = ?').run(id);	
	res.redirect('/posts');
});


// ------ routers: ADDITIONAL IMPLEMENTS ------
/* give user's posts */
app.get('/my', requireLogin, (req, res) => {
	// check id
	const my_id = req.session.user.id;
	
	const posts = db.prepare(`
		SELECT posts.id, posts.title, users.username
		FROM posts JOIN users ON posts.user_id = users.id  -- join two tables 
		WHERE posts.user_id = ?
		ORDER BY posts.id 
	`).all(my_id);
	
	res.render('list', { posts });
});

app.post('/admin/users/:id/role', requireAdmin, (req, res) => {
	const target_id = Number(req.params.id);  				// make sure 'id' be pure number
	const role = db.prepare(`SELECT role FROM users WHERE id = ?`).get(target_id);
	
	// determine next role
	var next_role;
	if (role['role'] === 'admin') { next_role = 'user'; }
	else 						  { next_role = 'admin'; }

	// change role
	const result = db.prepare("UPDATE users SET role = ? WHERE id = ?")
					 .run(next_role, target_id);
	
	res.redirect(`/admin`);
});


app.listen(PORT, () => { console.log(`서버 실행 중: http://localhost:${PORT}`); });