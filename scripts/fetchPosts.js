'use strict';

var Q = require('q');
var mongoose = require('mongoose');
mongoose.Promise = Q.Promise;
var _ = require('lodash');
var rp = require('request-promise');

var newPost = require('../models/newPost');
var config = require('../config');

mongoose.connect(config.mongo.uri, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false });

fetchPosts(); // Start

function fetchPosts() {
  console.time('Rising Work Took');
  return rp('https://www.reddit.com/r/politics/rising.json')
    .then(parseHtmlJson)
    .then(insertNewPosts)
    .then(() => wait())
    .then(() => { console.timeEnd('Rising Work Took'); })
    .then(fetchPosts)
    .catch(err => {
      console.warn(err);
      return wait(10).then(fetchPosts);
    });
}

function wait(sec = 5) {
  var deferred = Q.defer();
  setTimeout(deferred.resolve, sec * 1000);
  return deferred.promise;
}

function parseHtmlJson(htmlString) {
  var jsonData = JSON.parse(htmlString);
  return jsonData.data.children;
}

function insertNewPosts(newPosts) {
  var insertPromises = [];
  // Fill array with promises
  newPosts.forEach(function(value){
    insertPromises.push(newPost.findOneAndUpdate({
      title: value.data.title,
      author: value.data.author,
      created_utc: value.data.created_utc
    }, {
      title: value.data.title,
      domain: value.data.domain,
      url: value.data.url,
      commentLink: value.data.permalink,
      thumbnail: value.data.thumbnail,
      author: value.data.author,
      created_utc: value.data.created_utc,
      upvoteCount: value.data.ups,
      commentCount: value.data.num_comments,
      fetchedAt: new Date()
    }, { upsert: true }));
  });

  return Q.all(insertPromises);
}
