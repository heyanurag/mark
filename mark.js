#!/usr/bin/env node

args = process.argv;

const fs = require("fs");

const fd_pending = `${__dirname}/task.txt`;
const fd_done = `${__dirname}/completed.txt`;

let usage = `Usage :-
$ ./mark.sh add 2 hello world          # Add a new item with priority 2 and text "hello world" to the list.
$ ./mark.sh ls                         # Show incomplete priority list items sorted by priority in ascending order.
$ ./mark.sh del INDEX                  # Delete the incomplete item with the given index.
$ ./mark.sh done INDEX                 # Mark the incomplete item with the given index as complete.
$ ./mark.sh help                       # Show usage.
$ ./mark.sh report                     # Statistics.
$ ./mark.sh update INDEX 0 new_text    # Update an item's priority and/or text with the given index.
                                         Here, 0 is the new priority of that task & new_text is the new text for the task.
                                         If no new_text is provided, only the priority is updated.`;

/**
 * Creation of txt files if do not exist
 */
fs.appendFileSync(fd_pending, "", {
  encoding: "utf8",
  mode: 0o666,
});

fs.appendFileSync(fd_done, "", {
  encoding: "utf8",
  mode: 0o666,
});

/**
 * Write data to file
 */
const WriteFile = (ptr, data) => {
  fs.appendFileSync(ptr, data, {
    encoding: "utf8",
    flag: "w+",
    mode: 0o666,
  });
};

/**
 * Add data at end of the file
 */
const AppendDataFiles = (ptr, data) => {
  fs.appendFileSync(ptr, data, {
    encoding: "utf8",
    mode: 0o666,
  });
};

/**
 * Read data from file
 */
const ReadDataFiles = (ptr) => {
  const data = fs.readFileSync(ptr, "utf8");
  let info = [];

  if (data) {
    info = data.split("\n");
    info = info.filter((x) => x.length > 0);
  }

  return info;
};

/**
 * Return the priority and task string in the form of an array
 */
const getPriorityAndTask = (task) => task.split(/(?<=^\S+)\s/);

/**
 * Sort tasks based on priority
 */
const sortTasks = (tasks) => {
  const sortedTasks = tasks.sort((a, b) => {
    return a.split(" ")[0] - b.split(" ")[0];
  });

  return sortedTasks;
};

/**
 * Return the already exisitng tasks sorted by priority
 */
const getSortedTasks = (ptr) => {
  const tasks = ReadDataFiles(ptr);
  const sortedTasks = sortTasks(tasks);

  return sortedTasks;
};

/**
 * List of all tasks
 */
const listTasks = (ptr) => {
  const sortedTasks = getSortedTasks(ptr);

  if (sortedTasks.length > 0) {
    sortedTasks.forEach((task, index) => {
      const [priority, text] = getPriorityAndTask(task);
      console.log(`${index + 1}. ${text} [${priority}]`);
    });
  } else {
    console.log("There are no pending tasks!");
  }
};

/**
 * Add New task to task list
 */
const addTask = (ptr, priority, task) => {
  if (priority >= 0) {
    let oldTasks = getSortedTasks(ptr);
    oldTasks.push(`${priority} ${task}`);

    let sortedTasks = sortTasks(oldTasks);
    sortedTasks = sortedTasks.join("\n");

    WriteFile(ptr, sortedTasks);
    console.log(`Added task: "${task}" with priority ${priority}.`);
  } else {
    console.log("Error: Priority cannot be negative. Nothing added.");
  }
};

/**
 * Add task to completed list
 */
const addTaskToCompleted = (ptr, task) => {
  if (task && task.length > 0) {
    const [priority, text] = getPriorityAndTask(task);
    AppendDataFiles(ptr, text + "\n");
  }
};

/**
 * Remove task from pending tasks list
 */
const deleteTask = (ptr, index) => {
  let sortedTasks = getSortedTasks(ptr);

  if (index > sortedTasks.length || index < 1) {
    console.log(
      `Error: task with index #${index} does not exist. Nothing deleted.`
    );
  } else {
    sortedTasks[index - 1] = "";
    sortedTasks = sortedTasks.filter((x) => x.length > 0);
    sortedTasks = sortedTasks.join("\n");
    WriteFile(ptr, sortedTasks);
  }
};

/**
 * Removing of Task from pending tasks and adding it to completed tasks
 */
const completeTask = (taskPtr, completedPtr, index) => {
  let sortedTasks = getSortedTasks(taskPtr);

  if (index > sortedTasks.length || index <= 0) {
    console.log(`Error: no incomplete item with index #${index} exists.`);
  } else {
    addTaskToCompleted(completedPtr, sortedTasks[index - 1]);
    deleteTask(taskPtr, index);
    console.log(`Marked item as done.`);
  }
};

/**
 * Information about pending and completed tasks
 */
const generateReport = (taskPtr, completedPtr) => {
  const tasks = getSortedTasks(taskPtr);
  const completedTasks = ReadDataFiles(completedPtr);

  if (
    tasks &&
    tasks.length >= 0 &&
    completedTasks &&
    completedTasks.length >= 0
  ) {
    console.log(`Pending : ${tasks.length}`);
    listTasks(taskPtr);
    console.log(`\nCompleted : ${completedTasks.length}`);
    completedTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task}`);
    });
  }
};

/**
 * Update the Priority and text of a task
 */
const updateTask = (ptr, index, newPriority, newText) => {
  if (newPriority < 0) {
    console.log("Error: Priority cannot be negative. Nothing updated.");
  }

  let tasks = getSortedTasks(ptr);

  if (index < tasks.length || index > 0) {
    const [oldPriority, oldText] = getPriorityAndTask(tasks[index - 1]);
    newText = newText === "" ? oldText : newText;

    const updatedTask = `${newPriority} ${newText}`;
    tasks.splice(index - 1, 1, updatedTask);

    tasks = sortTasks(tasks);
    tasks = tasks.join("\n");

    WriteFile(ptr, tasks);
    console.log(`Updated item.`);
  } else {
    console.log(`Error: no item with index #${index} exists.`);
  }
};

/**
 * Run function according to command
 */
switch (args[2]) {
  case "help":
    console.log(usage);
    break;

  case "ls":
    listTasks(fd_pending);
    break;

  case "report":
    generateReport(fd_pending, fd_done);
    break;

  case "add":
    if (args[4] && args[4].length > 0) {
      addTask(fd_pending, args[3], args[4]);
    } else {
      console.log("Error: Missing tasks string. Nothing added!");
    }
    break;

  case "del":
    if (args.length >= 4) {
      deleteTask(fd_pending, args[3]);
      console.log(`Deleted task #${args[3]}`);
    } else {
      console.log("Error: Missing NUMBER for deleting tasks.");
    }
    break;

  case "done":
    if (args.length >= 4) {
      completeTask(fd_pending, fd_done, args[3]);
    } else {
      console.log("Error: Missing NUMBER for marking tasks as done.");
    }
    break;

  case "update":
    if (args.length >= 5) {
      updateTask(fd_pending, args[3], args[4], args[5] || "");
    } else {
      console.log("Error: Missing NUMBER for updating the priority.");
    }
    break;

  default:
    console.log(usage);
}
