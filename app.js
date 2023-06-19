//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect to mongodb database
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
//item schema to follow
const itemsSchema = new mongoose.Schema({
  name: String,
});
//Modeling my objects
const Item = mongoose.model("Item", itemsSchema);
//adding three items
const item1 = new Item({
  name: 'Welcome to your todolist!',
});


const item2 = new Item({
  name: 'Hit the + button to add a new item.',
});


const item3 = new Item({
  name: '<-- Hit this to delete an item.',
});
//an array for my items to be used to insert into db
const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]

};

const List = mongoose.model("List",listSchema);


app.get("/", function(req, res) {

  //Reading data from db
Item.find({}).then(function(foundItems){

  if (foundItems.length === 0){
    //inserting default items into db
    Item.insertMany(defaultItems)
      .then (function (){
      console.log("Successfully saved items to db");

      res.redirect("/");

}) 
   .catch(function (err) {
    console.log(err);
    });
  } else {res.render("list", {listTitle: "Today", newListItems: foundItems})};

  
});


//Making new Custom Lists using Express route parameters 
app.get("/:customListName", function(req,res){

    const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then(function(foundList){
    if (!foundList){
      //creates a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
    
      list.save();
      res.redirect("/" + customListName);
    } else {res.render("list",{listTitle: foundList.name, newListItems: foundList.items})};
  });

 

});


});
//Saving items in respect to their list name and custom lists
app.post("/", function(req, res){
  //user inputs the item here to be added to db
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const Additem = new Item({
    name: itemName,
  });

  if (listName === "Today"){
    Additem.save();
    res.redirect("/");

  } else {
    List.findOne({name: listName}).then(function(foundList){
      foundList.items.push(Additem);
      foundList.save();
      res.redirect("/" + listName);
    })

  }
 
});
// using the check box it will put item id and use mongoose commands to find and remove it from db
app.post("/delete", function(req, res){
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName ==="Today") {
    Item.findByIdAndRemove(checkItemId).then(function() {
      console.log("Successfully deleted item");
    });
    res.redirect("/")
  } else {
    List.findOneAndRemove({name: listName},{$pull: {items: {checkItemId}}}).then(function(foundList){
      res.redirect("/" + listName);
    });
  }


});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
