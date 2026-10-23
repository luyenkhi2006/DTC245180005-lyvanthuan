
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = 3000;

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.DB_HOST || 'mysql',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false
  }
);

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
});

const Topic = sequelize.define('Topic', {
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

const Comment = sequelize.define('Comment', {
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

User.hasMany(Topic, { foreignKey: 'userId' });
Topic.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

Topic.hasMany(Comment, { foreignKey: 'topicId' });
Comment.belongsTo(Topic, { foreignKey: 'topicId' });

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(__dirname + '/public'));

if (!process.env.SESSION_SECRET) {
  throw new Error('Thiếu SESSION_SECRET trong file .env');
}

app.use(session({
  name: 'forum.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 2 * 60 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

app.get('/', (req, res) => res.redirect('/topics'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (
      !/^[a-zA-Z0-9_]{3,50}$/.test(username) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 || password.length > 72
    ) {
      return res.status(400).render('register', {
        error: 'Tên đăng nhập, email hoặc mật khẩu không hợp lệ.'
      });
    }

    const hash = await bcrypt.hash(password, 12);
    await User.create({ username, email, password: hash });

    res.redirect('/login');
  } catch (err) {
    const message = err.name === 'SequelizeUniqueConstraintError'
      ? 'Tên đăng nhập hoặc email đã tồn tại.'
      : 'Không thể đăng ký tài khoản.';
    res.status(400).render('register', { error: message });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { username: (req.body.username || '').trim() }
    });

    if (!user || !(await bcrypt.compare(
      req.body.password || '', user.password
    ))) {
      return res.status(401).render('login', {
        error: 'Tên đăng nhập hoặc mật khẩu không đúng.'
      });
    }

    req.session.regenerate(err => {
      if (err) return res.status(500).send('Lỗi phiên đăng nhập.');

      req.session.user = {
        id: user.id,
        username: user.username
      };

      res.redirect('/topics');
    });
  } catch (err) {
    res.status(500).send('Lỗi đăng nhập.');
  }
});

app.post('/logout', requireLogin, (req, res) => {
  req.session.destroy(() => res.redirect('/topics'));
});

app.get('/topics', async (req, res) => {
  try {
    const topics = await Topic.findAll({
      include: [{ model: User, attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });

    res.render('topics', { topics });
  } catch (err) {
    console.error(err);
    res.status(500).send('Không thể tải chủ đề.');
  }
});

app.get('/topics/new', requireLogin, (req, res) => {
  res.render('new-topic', { error: null });
});

app.post('/topics', requireLogin, async (req, res) => {
  const title = (req.body.title || '').trim();
  const body = (req.body.body || '').trim();

  if (!title || title.length > 200 || !body || body.length > 10000) {
    return res.status(400).render('new-topic', {
      error: 'Tiêu đề hoặc nội dung không hợp lệ.'
    });
  }

  try {
    const topic = await Topic.create({
      title,
      body,
      userId: req.session.user.id
    });

    res.redirect('/topics/' + topic.id);
  } catch (err) {
    console.error(err);
    res.status(500).send('Không thể tạo chủ đề.');
  }
});

app.get('/topics/:id', async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['username'] },
        {
          model: Comment,
          include: [{ model: User, attributes: ['username'] }]
        }
      ]
    });

    if (!topic) return res.status(404).send('Không tìm thấy chủ đề.');

    res.render('topic-detail', { topic });
  } catch (err) {
    console.error(err);
    res.status(500).send('Không thể tải chủ đề.');
  }
});

app.post('/topics/:id/comments', requireLogin, async (req, res) => {
  const body = (req.body.body || '').trim();

  if (!body || body.length > 5000) {
    return res.status(400).send('Bình luận không hợp lệ.');
  }

  try {
    const topic = await Topic.findByPk(req.params.id);
    if (!topic) return res.status(404).send('Không tìm thấy chủ đề.');

    await Comment.create({
      body,
      userId: req.session.user.id,
      topicId: topic.id
    });

    res.redirect('/topics/' + topic.id);
  } catch (err) {
    console.error(err);
    res.status(500).send('Không thể gửi bình luận.');
  }
});

async function start() {
  await sequelize.authenticate();
  console.log('MySQL connected.');

  await sequelize.sync();
  console.log('MySQL connected; tables synchronized.');

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Forum running on port ' + PORT);
  });
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});

