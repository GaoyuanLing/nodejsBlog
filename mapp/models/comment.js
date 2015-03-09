var mongodb = require('./db');

function Comment(name, title, day, comment){
    this.name = name;
    this.title = title ;
    this.day = day;
    this.comment = comment;
};

module.exports = Comment;

Comment.prototype.save = function(callback){
    var name = this.name;
    var comment = this.comment;
    var title = this.title;
    var day = this.day;
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection){
            if (err){
                mongodb.close();
                return callback(err);
            }
            
            console.log(this.comment);
            collection.update({
                "name": name,
                "title": title,
                "time.day": day
            }, {$push: {"comments": comment}},function (err){
                mongodb.close();
                if(err)
                    callback(err);
                callback(null);
            });
        });
    });
};

