var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post){
    this.name = name;
    this.title = title;
    this.post = post;
}

module.exports = Post

Post.prototype.save = function(callback){
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        miniute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post,
        comments: []
    };
    console.log(time);
 
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', {safe: true}, function (err, collection){
            if (err){
                mongodb.close();
                return callback(err);
            }
     
           
           collection.insert(post, {safe: true}, function(err){
               mongodb.close();
               if(err){
                   return callback(err);
               }
               callback(null);
           });
        });
    });
};

Post.getTen = function (name, page, callback){
    mongodb.open(function (err, db){
        if(err){
            return callback(err);
        }
   
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
      
            var query = {};
            if (name){
                query.name = name;
            }

            collection.count(query, function(err, total){
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1    
                }).toArray(function (err, docs){
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    docs.forEach(function(doc){
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total);
                });
            });
        });
    });
};

Post.getOne = function (name, day, title, callback){
    mongodb.open(function (err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
 
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc){
                console.log('test1');
                mongodb.close();
                if (err){
                    return callback(err);
                }
                if(doc){
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment){
                        comment.content = markdown.toHTML(comment.content);
                    });
                }
                callback(null, doc);
            });
        });
    });
}

Post.edit = function(name, day, title, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "name": name,
                "title": title,
                "time.day": day
            }, function(err, doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }
 
                callback(null, doc)
            });
        });
    });
};

Post.update = function(name, title, day, post, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        var date = new Date();
        var time = {
            date: date,
            year: date.getFullYear(),
            month: date.getFullYear() + '-' + (date.getMonth() + 1),
            day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
            miniute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        };
 
        
        db.collection('posts', function (err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.findAndModify({
                "name": name,
                "title": title,
                "time.day": day
            }, [['_id', 'desc']], {$set: {post: post, time: time}}, function (err, doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }

                callback(null, doc);
            });
        });
    });
};

Post.remove = function(name, title, day, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function (err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
 
            collection.remove({
                "name": name,
                "title": title,
                "time.day": day
            }, function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Post.getArchive = function (callback){
    mongodb.open(function (err, db){
        if(err){
            return callback(err);
        }
   
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
      
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({'time': -1}).toArray(function (err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

