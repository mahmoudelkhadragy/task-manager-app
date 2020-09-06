const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const User = require('../models/user');
const auth = require('../middleware/auth');

router.post('/tasks', auth ,async(req, res)=>{
  // const task = new Task(req.body);
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })

  try{
    await task.save()
    res.status(201).send(task);
  }catch(e){
    res.status(400).send(e);
  }

})

//GET /tasks?completed=true
//GET /tasks?limit=10&skip=20
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks',auth , async (req,res)=>{
  const match = {}
  const sort = {}

  if(req.query.completed){
    match.completed = req.query.completed === 'true'
  }

  if(req.query.sortBy){
    const parts = req.query.sortBy.split(':');
    let sortType = 1;
    if(parts[1] === 'desc'){
      sortType = -1
    }else if(parts[1] === 'asc'){
      sortType = 1
    }
    sort[parts[0]] = sortType;
  }


  try{
    await req.user.populate({
      path: 'tasks',
      match,
      options:{
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()
    res.send(req.user.tasks)
  }catch(e){
    res.status(500).send(error);
  }

})

router.get('/tasks/:id', auth, async (req, res)=>{
  const _id = req.params.id;
  try{
    const task = await Task.findOne({_id, owner: req.user._id})

    if(!task){
      return res.status(404).send()
    }
    res.send(task)
  }catch(e){
    res.status(500).send(error)
  }
})

router.patch('/tasks/:id',auth, async(req,res)=>{

  const updates = Object.keys(req.body);
  const allowedUpdates = ["completed", "description"];
  const isAllowedUpdate = updates.every((update)=> allowedUpdates.includes(update));
  
  if(!isAllowedUpdate){
    return res.status(400).send({error: 'Invalid updates'});
  }

  try {
    const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
    
    if(!task){
      return res.status(404).send();
    }
    updates.forEach((update)=> task[update] = req.body[update]);
    await task.save();

    res.send(task)
  } catch (error) {
    res.status(400).send(error)
  }
})

//delete task
router.delete('/tasks/:id',auth , async(req,res)=>{
  try {
    const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});
    if(!task){
      return res.status(404).send()
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
})

module.exports = router;
