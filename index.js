const express = require("express");
const util = require("util");
const app = express();
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const RedisIo = require("ioredis");
const { default: axios } = require("axios");
// reference Tutorial ( YouTube ) >>>https://www.youtube.com/watch?v=phkZIG3xsVA&t=11s
// reference Tutorial ( YouTube ) >>>https://youtu.be/AzQ6_DTcG6c?si=MkiPp9jfVLhHPb2W

// const RedisUrl = "127.0.0.1:6379";
// const RedisStore = connectRedis(session);

const redisIoClient = new RedisIo();
const redisClient = createClient({
  host: "localhost",
  port: 6379,
}); // this connects to redis default port of 6379
// await client.connect();
redisIoClient
  .connect()
  .then(() => {
    console.log("Connected to Redis");
  })
  .catch((err) => {
    console.log(err.message);
  });
// client.set = util.promisify(client.set);
// client.get = util.promisify(client.get);
// console.log(clientSet, "clientSet");

app.use(express.json());

//Configure session middleware
app.use(
  session({
    store: new RedisStore({ client: redisIoClient }),
    secret: "secret$%^134",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // if true only transmit cookie over https
      httpOnly: false, // if true prevent client side JS from reading the cookie
      maxAge: 1000 * 60 * 10, // session max age in miliseconds
    },
  })
);

app.post("/", async (req, res) => {
  const { key, value } = req.body;
  //   console.log(key, value, "respd-1");
  const response = await redisIoClient.set(key, value);
  //   console.log(response, "resp-2");
  res.send(response);
});
// app.get("/", async (req, res) => {
//   const { key } = req.body;
//   const keyValue = await redisClient.get(key);
//   res.json(keyValue);
// });

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;

  const cachedId = await redisIoClient.get(`post-${id}`);
  if (cachedId) {
    return res.json(JSON.parse(cachedId));
  }
  const getData = await axios.get(
    `https://jsonplaceholder.typicode.com/todos/${id}`
  );

  res.status(200).json(getData.data);
  redisIoClient.set(`post-${id}`, JSON.stringify(getData.data), "EX", 10);
});

// using redis-session , redis-connect, redis

app.get("/", (req, res) => {
  const sess = req.session;
  if (sess.username && sess.password) {
    if (sess.username) {
      res.write(`<h1>Welcome ${sess.username} </h1><br>`);
      res.write(`<h3>This is the Home page</h3>`);
      res.end("<a href=" + "/logout" + ">Click here to log out</a >");
    }
  } else {
    res.sendFile(__dirname + "/login.html");
  }
});

app.post("/login", (req, res) => {
  const sess = req.session;
  const { username, password } = req.body;
  sess.username = username;
  sess.password = password;
  //add user validation logic here
  res.end("success");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    // res.redirect("/")
    res.json("session revoked");
  });
});

app.listen(8080, () => {
  console.log("hey app listening on port 8080");
});
