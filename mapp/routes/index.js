var express = require('express');
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment= require('../models/comment.js');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res) {
  var page = req.query.p ? parseInt(req.query.p) : 1;
  Post.getTen(null, page,function(err, posts, total){
      if(err){
          posts = [];
      }
      res.render('index', {
        title: '主页',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        posts: posts,
        total: total,
        page: page,
        isFirstPage: (page -1) == 0,
        isLastPage: ((page - 1)*10 + posts.length) == total
      });
  });
});

router.get('/reg', checkLogin);
router.get('/reg', function(req, res) {
  res.render('reg', { title: '注册',
    error: req.flash('error').toString(),
    success: req.flash('success').toString()
  });
});

router.get('/login', function(req, res) {
  res.render('login', { 
    title: '登陆',
    error: req.flash('error').toString(),
    success: req.flash('success').toString()
  });
});

router.get('/post', checkNotLogin);
router.get('/post', function(req, res) {
  res.render('post', { 
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()      
  });
});

router.post('/reg', function(req, res) {
  var name = req.body.name;
  var password = req.body.password;
  var password_re = req.body['password-repeat'];
  if(name == null){
      req.flash('error', '姓名不能为空');
      return res.redirect('/reg');
  }
 
  if(password == null){
      req.flash('error', '密码不能为空');
      return res.redirect('/reg');
  }
  if(password_re != password){
      req.flash('error', '两次输入密码不一致');
      return res.redirect('/reg');
  }
  
  var md5 = crypto.createHash('md5');
  var password = md5.update(password).digest('hex');
  var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
  });
  
  User.get(newUser.name, function(err, user){
      if(user){
          req.flash('error', '用户已存在！');
          return res.redirect('/reg');
      }
   
      newUser.save(function(err, user){
          if(err){
              req.flash('error', err);
              return res.redirect('/reg');
          }
          req.session.user = user;
          req.flash('success', '注册成功');
          res.redirect('/');
      });
  });
});

router.post('/login', function(req, res) {
    var name = req.body.name;
    var password = req.body.password;
    var md5 = crypto.createHash('md5');
    var password = md5.update(password).digest('hex');
    User.get(req.body.name, function(err, user){
        if(!user){
            req.flash('error', '用户不存在');
            return res.redirect('/login');
        }
        
        if(user.password != password){
            req.flash('error', '密码或用户名错误');
            return res.redirect('/login');
        }
        req.session.user = user;
        req.flash('success', '登陆成功');
        res.redirect('/');
    });
});

router.get('/logout', function(req, res) {
    req.session.user = null;
    console.log("====");
    req.flash('success','登出成功');
    res.redirect('/');
});

function checkNotLogin(req, res, next){
    if(!req.session.user){
        req.flash('error', '未登陆');
        res.redirect('/login');
    }
    next();
}

function checkLogin(req, res, next){
    if(req.session.user){
        req.flash('error', '已登陆');
        res.redirect('back');
    }
    next();
}

router.post('/post', checkNotLogin);
router.post('/post', function (req, res){
    var currentUser = req.session.user;
    console.log("+++"); 
    console.log(currentUser); 
    var post = new Post(
        currentUser.name,
        req.body.title,
        req.body.post
    );

    post.save(function(err){
        if(err){
            req.flash('error', err);
            return res.redirect('/');
        }

        req.flash('success', '发布成功');
        res.redirect('/');
    });
});

router.get('/upload', checkNotLogin);
router.get('/upload', function(req, res){
    res.render('upload', 
    {
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/upload', checkNotLogin);
router.post('/upload', function(req, res){
    for (var i in req.files){
        if(req.files[i].size == 0){
            fs.unlinkSync(req.files[i].path);
        }else{
            var target_path = './public/images/' + req.files[i].originalname;
            fs.renameSync(req.files[i].path, target_path);
            console.log('Successful renamed a file!');
        }
    }
    req.flash('success', '上传成功');
    res.redirect('/');
});

router.get('/archive', function(req, res){
    Post.getArchive(function(err, posts){
        if(err){
            req.flash('error', err);
            return res.redirect('/');
        }
        console.log("==================");
        res.render('archive', {
            title: '文档',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/u/:name', function (req, res){
    User.get(req.params.name, function(err, user){
        if(!user){
            req.flash('error', '不存在该用户');
            return res.redirect('/');
        }
        var page = req.query.p ? parseInt(req.query.p) : 1;

        Post.getTen(user.name, page, function(err, posts, total ){
            if(err){
                req.flash('error', err);
            }

            res.render('user', {
                title: user.name,
                page: page,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                isFirstPage: (page -1) == 0,
                isLastPage: ((page - 1)*10 + posts.length) == total
            });
        });
    });
});

router.get('/u/:name/:title/:day', function (req, res){
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post){
        if(err){
            req.flash('error', err);
            return res.redirect('/');
        }
        if(post){
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                comments: post.comments,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        }else{
            req.flash('error', '没有找到这篇文章');
            return res.redirect('/');
        }
    });
})

router.get('/edit/:name/:title/:day', checkNotLogin);
router.get('/edit/:name/:title/:day', function(req, res){
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post){
        if(err){
            req.flash('error', err);
            return res.redirect('/');
        }
        console.log(post);

        res.render('edit', {
            title: '编辑',
            post: post,
            user: currentUser,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.post('/edit/:name/:title/:day', checkNotLogin);
router.post('/edit/:name/:title/:day', function (req, res){
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.title, req.params.day, req.body.post, function(err, post){
        if(err){
            req.flash('error', err);
            return res.redirect('/');
        }
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.title + '/' + post.time.day);
        req.flash('success', '更新成功');
        res.redirect(url);
    });
});

router.get('/remove/:name/:title/:day', checkNotLogin);
router.get('/remove/:name/:title/:day', function(req, res){
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.title, req.params.day, function(err){
        if(err){
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '删除成功');
        res.redirect('/');
    });
});

router.post('/u/:name/:title/:day', checkNotLogin);
router.post('/u/:name/:title/:day', function(req, res){
    var date = new Date();
    var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.title, req.params.day, comment);
    console.log("+++++");
    newComment.save(function(err){
        if(err){
            req.flash('error', err);
            return res.return('back');
        }
        console.log("====");
        req.flash('success', '评论成功!');
        res.redirect('back');
    });
});

module.exports = router;
