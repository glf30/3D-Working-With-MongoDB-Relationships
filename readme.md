# 3D - Working With Relationships

This lesson reintroduces MongoDB referenced relationships — where one document (e.g. a Task) holds a reference to another document (e.g. a User). You’ll learn how to:

- Set up one-to-many relationships using ObjectId references
- Fetch related documents with `.populate()`
- Build basic controllers and routers
- Test your endpoints before adding validation
- Add validation with express-validator **after testing**

```
// Example of an ObjectId relationship:
const taskSchema = new mongoose.Schema({
  title: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});
```
## Setup

Start by installing dependencies:

```bash
npm install express mongoose dotenv morgan
```

## 1. Create the User model

We’ll start by building a `User` model. Each user will eventually be able to have many tasks associated with them.

In `models/User.js`, add:

```
// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
```

## 2. Create the Task model

Each task will reference one user using `Schema.Types.ObjectId`. This is how MongoDB creates relationships across collections.

In `models/Task.js`, add:

```
// models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
```

## 3. Test your models by adding a basic controller

Before writing routes, we’ll create a controller to handle logic for creating users and tasks.

Make a `controllers/usersController.js` file:

```
// controllers/usersController.js
const User = require("../models/User");

async function createUser(userData) {
  try {
    const newUser = await User.create(userData);
    return newUser;
  } catch (error) {
    throw error;
  }
}

module.exports = { createUser };
```

Then create a `controllers/tasksController.js`:

```
// controllers/tasksController.js
const Task = require("../models/Task");

async function createTask(taskData) {
  try {
    const newTask = await Task.create(taskData);
    return newTask;
  } catch (error) {
    throw error;
  }
}

async function getTasksByUser(userId) {
  try {
    const tasks = await Task.find({ user: userId }).populate("user");
    return tasks;
  } catch (error) {
    throw error;
  }
}

module.exports = { createTask, getTasksByUser };
```

## 4. Set up routers to test your controllers

Create a `routes/usersRouter.js`:

```
// routes/usersRouter.js
const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/usersController");

router.post("/", async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.json({ message: "success", payload: user });
  } catch (error) {
    res.status(500).json({ message: "failure", payload: error.message });
  }
});

module.exports = router;
```

Now make `routes/tasksRouter.js`:

```
// routes/tasksRouter.js
const express = require("express");
const router = express.Router();
const { createTask, getTasksByUser } = require("../controllers/tasksController");

router.post("/", async (req, res) => {
  try {
    const task = await createTask(req.body);
    res.json({ message: "success", payload: task });
  } catch (error) {
    res.status(500).json({ message: "failure", payload: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const tasks = await getTasksByUser(req.params.userId);
    res.json({ message: "success", payload: tasks });
  } catch (error) {
    res.status(500).json({ message: "failure", payload: error.message });
  }
});

module.exports = router;
```
## 5. Plug routes into `index.js`

Update `index.js` to use your routers:

```
const userRouter = require("./routes/usersRouter");
const taskRouter = require("./routes/tasksRouter");

app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);
```

## 6. Test your API routes with Postman

Make sure MongoDB is connected and your server is running

Then in Postman, we'll create a user and a task.

## 7. Add validation with `express-validator`

We’ll add input validation to make sure:
- Users cannot be created without a username.
- Tasks cannot be created without a title or user ID.
- User IDs must be valid MongoDB ObjectIds.

Start by installing `express-validator`:

```
npm install express-validator
```

Then update the user route to validate the username field.
Edit `routes/usersRouter.js`:

```
// routes/usersRouter.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const { createUser } = require("../controllers/usersController");

const router = express.Router();

router.post(
  "/",
  body("username").notEmpty().withMessage("Username is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "validation failure", payload: errors.array() });
    }

    try {
      const user = await createUser(req.body);
      res.json({ message: "success", payload: user });
    } catch (error) {
      res.status(500).json({ message: "failure", payload: error.message });
    }
  }
);

module.exports = router;
```

Now add validation to the tasks route.  
We’ll check that:
- `title` exists and isn’t empty
- `user` exists and is a valid MongoDB ObjectId

Update `routes/tasksRouter.js`:

```
// routes/tasksRouter.js
const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { createTask, getTasksByUser } = require("../controllers/tasksController");

const router = express.Router();

router.post(
  "/",
  body("title").notEmpty().withMessage("Title is required"),
  body("user").isMongoId().withMessage("User ID must be a valid MongoDB ObjectId"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "validation failure", payload: errors.array() });
    }

    try {
      const task = await createTask(req.body);
      res.json({ message: "success", payload: task });
    } catch (error) {
      res.status(500).json({ message: "failure", payload: error.message });
    }
  }
);

router.get(
  "/user/:userId",
  param("userId").isMongoId().withMessage("Invalid user ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "validation failure", payload: errors.array() });
    }

    try {
      const tasks = await getTasksByUser(req.params.userId);
      res.json({ message: "success", payload: tasks });
    } catch (error) {
      res.status(500).json({ message: "failure", payload: error.message });
    }
  }
);

module.exports = router;
```

## 8. Test validation in Postman

Make a bad request, like posting a task with an empty title or invalid user ID
