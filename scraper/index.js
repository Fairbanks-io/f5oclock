const Q = require('q');
const mongoose = require('mongoose');
const fs = require('fs');

mongoose.Promise = Q.Promise;
const rp = require('request-promise');

const newPost = require('./models/newPost');

const subreddit = process.env.SUBREDDIT || 'politics';
const redditUrl = `https://www.reddit.com/r/${subreddit}/rising.json`;

fs.readFile('/var/openfaas/secrets/mongouri', 'utf8', (secretError, mongoUri) => {
  if (secretError) {
    console.log(secretError); // eslint-disable-line no-console
  }

  mongoose.connect(
    mongoUri,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    },
  ).catch(
    (dbError) => console.warn(`MongoDB connection error: ${dbError}`), // eslint-disable-line no-console
  );
});

const parseHtmlJson = (htmlString) => {
  let jsonData = null;
  jsonData = JSON.parse(htmlString);
  return jsonData.data.children;
};

const imageSource = (data) => {
  if (data.preview) {
    if (data.preview.images) {
      if (data.preview.images.length > 0) {
        return data.preview.images[0].source.url.replace(/amp;/g, '');
      }
    }
  }

  if (data.is_gallery) {
    if (data.gallery_data) {
      if (data.gallery_data.items) {
        if (data.gallery_data.items.length > 0) {
          return data.media_metadata[data.gallery_data.items[0].media_id].s.u.replace(/amp;/g, '');
        }
      }
    }
  }

  return data.thumbnail;
};

const insertNewPosts = (newPosts) => {
  let insertPromises = [];
  // Fill array with promises
  newPosts.forEach((value) => {
    insertPromises.push(newPost.findOneAndUpdate({
      title: value.data.title,
      author: value.data.author,
      created_utc: value.data.created_utc,
    }, {
      title: value.data.title,
      domain: value.data.domain,
      url: value.data.url,
      commentLink: value.data.permalink,
      thumbnail: imageSource(value.data),
      author: value.data.author,
      created_utc: value.data.created_utc,
      upvoteCount: value.data.ups,
      commentCount: value.data.num_comments,
      fetchedAt: new Date(),
      post_hint: value.data.post_hint,
      is_video: value.data.is_video,
      media: value.data.media,
      is_gallery: value.data.is_gallery,
      gallery_data: value.data.gallery_data,
      media_metadata: value.data.media_metadata,
      is_self: value.data.is_self, 
      selftext: value.data.selftext,
      selftext_html: value.data.selftext_html,
      upvote_ratio: value.data.upvote_ratio,
      sub: subreddit,
    }, { upsert: true }));
  });

  return Q.all(insertPromises)
    .catch((e) => {
      console.warn(`Error Inserting Posts @ ${Date.now()}: ${e}`); // eslint-disable-line no-console
    })
    .fin(() => {
      insertPromises = [];
      mongoose.disconnect();
    })
    .done();
};

const fetchPosts = () => {
  rp({ uri: redditUrl, timeout: 4000 })
    .then(parseHtmlJson)
    .then(insertNewPosts)
    .then(
      console.log(`Saved New Posts @ ${Date.now()}`), // eslint-disable-line no-console
      console.log(`Currently using ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB of memory \n`), // eslint-disable-line no-console
    )
    .catch(() => {
      console.warn(`Error Fetching Posts @ ${Date.now()}. This may be due to a timeout from Reddit.`); // eslint-disable-line no-console
      mongoose.disconnect();
    })
    .done();
};

mongoose.connection.on('connected', () => {
  console.log(`F5 is now saving posts to MongoDB from ${subreddit}...\n`); // eslint-disable-line no-console
  fetchPosts();
});

mongoose.connection.on('disconnected', (err) => {
  console.warn(`MongoDB disconnected: ${err}`); // eslint-disable-line no-console
});

mongoose.connection.on('error', (err) => {
  console.warn(`MongoDB error: ${err}`); // eslint-disable-line no-console
});
