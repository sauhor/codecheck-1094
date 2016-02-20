'use strict';
var
express = require('express'),
        app = express(),
        port = process.env.PORT || 3000,
        parser = require('body-parser'),
        knex = require('knex')({
            client: 'sqlite3',
            connection: {
                filename: ":memory:"
            }

        });

app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());
app.use(express.static(__dirname + '/public'))

app.get('/api/projects', function (req, res, next) {
    knex.select('*').from('projects')
        .then(function (projects) {
            res.status(200).json(projects);
            return next();
        })
    .catch(function (err) {
        res.status(500).json(err);
        return next();
    });
});

app.post('/api/projects', function (req, res, next) {
    var
        title = req.body.title,
        description = req.body.description,
        url = req.body.url;

    if (!title || !description) {
        res.status(400).json('BadRequest');
        return next();
    }

    knex('projects').insert({
        title: title,
        description: description,
        url: url
    }).then(function (ids) {
        res.status(200).json({
            id: ids[0],
            title: title,
            description: description,
            url: url
        })
        return next();
    }).catch(function (err) {

        knex('projects').where({
            title: title,
            description: description
        }).select('id')
        .then(function (id) {
            if (id) {
                res.status(400).json('BadRequest');
                return next();
            }
        })

        res.status(500).json(err);
        return next();
    });
});

app.delete('/api/projects/:id', function (req, res, next) {

    var id = req.params.id;

    knex('projects')
        .where('id', id)
        .del()
        .then(function (num){

            if (num) {
                res.status(200).json('OK');
                return next();

            } else {
                res.status(404).json('NotFound');
                return next();

            }
        }).catch(function (err) {
            res.status(500).json(err)
                return next();
        })

});

app.get('/api/projects/:id', function (req, res, next) {
    var id = req.params.id;
    knex.where('id', id)
        .select('*')
        .from('projects')
        .then(function (projects) {
            if (Object.keys(projects).length !== 0) {
                res.status(200).json(projects);
                return next(); 
            } else {
                res.status(404).json("NotFound");
                return next();

            }
        })
    .catch(function (err) {
        res.status(500).json(err);
        return next();
    });
});


/** @ToDo
 * Initialize database
 * this is for 'in-memory' database and should be removed
 *
 * テーブル増やすと壊れるから気をつけて!
 */
var sqls = require('fs')
.readFileSync(__dirname + '/specifications/database.sql')
.toString();

knex.raw(sqls)
    .then(function () {
        /** @ToDo
         * Run server after database initialization
         * this is for 'in-memory' database and should be removed
         */
        app.listen(port, function () {
            console.log("Server running with port", port)
        });
    });
