const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
const port = 5000;

app.use(express.json());

// const { MongoClient, ServerApiVersion } = require("mongodb");
const mongoose = require("mongoose");

// mongoose schema
const todoSchema = new mongoose.Schema({
  todo: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    required: true,
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const Todo = mongoose.model("Todo", todoSchema);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    validation: () => {
      const re = /\S+@\S+\.\S+/;
      return re.test(this.email);
    },
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

const uri =
  "mongodb+srv://todo-admin:123456todo@cluster0.jwzzltb.mongodb.net/todoDB?appName=Cluster0";

async function run() {
  try {
    await mongoose.connect(uri);
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    // const todosCollection = client.db("todoDB").collection("todos");
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // todo crud operations
    app.get(
      "/todos",
      async (req, res, next) => {
        const privateKey = "secret";
        const token = req.headers.authorization;
        const verifiedToken = jwt.verify(token, privateKey);
        if (verifiedToken) {
          next();
        } else {
          res.status(401).send({ message: "Unauthorized access" });
        }
      },
      async (req, res) => {
        // const todos = await todosCollection.find().toArray();
        const todos = await Todo.find();
        res.send(todos);
      }
    );

    app.get("/todo/:id", async (req, res) => {
      const id = req.params.id;
      // const todo = await todosCollection.findOne({ _id: new ObjectId(id) });
      const todo = await Todo.findById(id);
      res.send(todo);
    });

    app.post("/todo", async (req, res) => {
      const todoData = req.body;
      // const todo = new Todo(todoData);
      // const result = await todo.save();
      const todo = await Todo.create(todoData);
      console.log(todo);
      res.send(todo);
    });

    // put/ patch operation
    app.patch("/todo/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      // const result = await todosCollection.updateOne(
      //   { _id: new ObjectId(id) },
      //   { $set: updatedData }
      // );
      const result = await Todo.findByIdAndUpdate(id, updatedData, {
        new: true,
      });
      res.send(result);
    });

    //delete todo
    app.delete("/todo/:id", async (req, res) => {
      const id = req.params.id;
      // const result = await todosCollection.deleteOne({ _id: new ObjectId(id) });
      const result = await Todo.findByIdAndDelete(id);
      res.send(result);
    });

    // user crud operations
    app.post("/register", async (req, res) => {
      const userData = req.body;
      const user = await User.create(userData);
      console.log(user);
      res.send(user);
    });
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;
      const user = await User.findOne({ email, password });
      if (user) {
        const payload = {
          name: user.name,
          email: user.email,
        };

        const privateKey = "secret";

        const expirationTime = "1d";

        const accessToken = jwt.sign(payload, privateKey, {
          expiresIn: expirationTime,
        });

        const userResponse = {
          message: "Login successful",
          data: {
            accessToken,
          },
        };
        res.send(userResponse);
      } else {
        res.status(401).send({ message: "Invalid email or password" });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Todo-task app listening on port ${port}`);
});
