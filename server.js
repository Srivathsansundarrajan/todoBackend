const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
app.use(express.json())
app.use(cors({origin: 'https://gleaming-sunflower-f114ca.netlify.app'}));
// app.use(cors({origin:'http://localhost:5173'}));

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
.then(console.log("Database connected successfully"))
.catch((error)=>{console.log(error)});

const schema = mongoose.Schema({
    email:String,
    psd:String,
});

const taskSchema = new mongoose.Schema({
    email: { type: String, required: true },
    task: { type: String, required: true },
    completed : {type: Boolean,required:true}    
});

const model = mongoose.model("loginCred",schema);
const taskmodel = mongoose.model('Task', taskSchema);

const PORT = process.env.PORT||5000;

app.listen(PORT,()=>{
    console.log(`server listening at ${PORT}`);
});

app.post("/login", async (req, res) => {
  console.log("Hiii");
    const { email, psd } = req.body;
    console.log(email);
    try {
        const user = await model.findOne({ email, psd });
        if (user) {
            res.status(200).json({ message: "Successfully logged in" });
        } else {
            res.status(401).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error });
    }
});


app.post("/signup",async(req,res)=>{
    const{email,psd} = req.body;

    try{
        const existingUser = await model.findOne({"email":email});
        if(!existingUser){
            const data = new model({email,psd});
            await data.save();

            res.status(200).json({message :"Successfully signedup"});
        }
        else{
            res.status(401).json({message :"User already exists"});
        }
    }
    catch(error){
        res.status(500).json({message :"Internal server error"});
    }
    
});

app.get("/todo/:email", async (req, res) => {
    try {
      const tasks = await taskmodel.find({ email: req.params.email });
      res.status(200).json({result:tasks});
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.post("/todo/add", async (req, res) => {
    const { email, task,completed} = req.body;
  
    try {
      const newTask = new taskmodel({"email":email, "task":task ,"completed":completed});
      await newTask.save();
  
      
      res.status(200).json({ message: 'Task added',result: newTask });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add task' });
    }
  });

  app.delete("/todo/delete/:id", async (req, res) => {
    try {
      await taskmodel.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Task deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });
  
  app.put('/todo/taskUpdate', async (req, res) => {
    try {
      const { email, task, completed } = req.body;
  
      if (!email || !task || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'Invalid request body' });
      }
  
      const updatedTask = await taskmodel.findOneAndUpdate(
        { email, task },            // Find task by email + task name
        { completed: completed },   // Update the completed field
        { new: true }               // Return the updated document
      );
  
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: error });
    }
  });