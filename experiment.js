//-- General helper functions

function showSlide(id) {
  //Show only a slide with a specific ID
  $(".slide").hide();
  $("#" + id).show();
}

function randint(a, b) {
  //Get random integers. Behaves like numpy.randint.
  if (typeof b == "undefined") {
      a = a || 2;
      return Math.floor(Math.random() * a);
  } else {
      return Math.floor(Math.random() * (b-a+1)) + a;
  }
}

Array.prototype.random = function() {
  //Randomly select and return an elemant of the array
  return this[randint(this.length)];
}

//-- Functions related to control over experimental stimuli

fillBG = function(){
  //Fill in the canvas background with a medium gray  
  stim.fillStyle = "gray";
  stim.fillRect(0, 0, stim.canvas.width, stim.canvas.height);
}

drawCircle = function(x, y, d, color){
  //Draw a single circle with low-level parameters
  stim.beginPath();
  stim.arc(x, y, d / 2, 0, 2 * Math.PI);
  stim.closePath();
  stim.fillStyle = color;
  stim.fill();
}

drawArray = function(trialData){
  //Draw an array with information in a trial object
  n_circles = trialData.sizes.length;
  fillBG();
  for (i = 0; i < n_circles; i++) {
      drawCircle(trialData.xlocs[i],
                 trialData.ylocs[i],
                 trialData.sizes[i],
                 trialData.colors[i]);
  }
}

testMemory = function(trialData){
  //Display the test stimulus and trigger the size selection
  //code that gets handled at a lower-lever by the code below
  fillBG();
  window.testData.xloc = trialData.targ_xloc;
  window.testData.yloc = trialData.targ_yloc;
  window.testData.origSize = randint(10, 85);
  drawCircle(testData.xloc,
             testData.yloc,
             testData.origSize,
             "black");
  document.onmousemove = sizeSlider;
  document.onmousedown = saveSize;
}

sizeSlider = function(evt){
  //Let the participant use mouse to report the size of the target stim
  if (window.mouseStart == null) {
    console.log(evt.pageY);
    window.mouseStart = evt.pageY;
    curIndex = experiment.data.length - 1;
    experiment.data[curIndex].reportStart = (new Date()).getTime();
  }

  curPos = evt.pageY;
  newSize = testData.origSize - (curPos - window.mouseStart);
  window.testData.curSize = newSize;
  fillBG();
  drawCircle(testData.xloc,
             testData.yloc,
             testData.curSize,
             "black");
}

saveSize = function(evt){
  //Lock in the response about the test stimulus size  
  document.onmousemove = null;
  window.mouseStart = null;
  curIndex = experiment.data.length - 1;
  experiment.data[curIndex].reportSize = testData.curSize;
  experiment.data[curIndex].reportFinish = (new Date()).getTime();
  experiment.next();
}

//-- Global variables (probably needed because I am bad at Javasvript
var testData = {};
var mouseStart = null;
var stim = $("canvas")[0].getContext("2d")

//-- Main experimental code

// Set up the trials, which are randomized across participants
// subject to the constraint that paired arrays can't appear sequentially
var trials = [];
var used_trials = [];
while (trials.length < design.length) {
  to_use = randint(design.length);
  if (used_trials.indexOf(to_use) == -1) {
    this_trial = design[to_use];
    this_id = this_trial.id;
    last_index = trials.length -1
    last_id = last_index > -1 ? trials[last_index].id : "causefalse";
    if (this_id != last_id) {
      trials.push(this_trial);
    }
  }
}

// Show the instructions slide
showSlide("instructions");

//Define the main object that controls the rest of the experiment
var experiment = {

  //Information about what should happen
  trials: trials, 

  //Information about what did happen
  data: [],

  end: function() {
    // Complete the experiment and submit to Turk
    showSlide("finished");
    setTimeout(function() { turk.submit(experiment) }, 1500);
  },


  next: function() {
    //Execute all the processing for a trial in the experiment
 
    showSlide("stimulus");

    //Get this trial's information
    var trial = this.trials.shift();
    //`trial` will be undefined if the experiment is over
    if (typeof trial == "undefined") { return this.end() }

    this.data.push(trial);

    //Go through the stages of the trial
    fillBG();
    setTimeout(function() { drawArray(trial) }, 1000);
    setTimeout(fillBG, 2500);
    setTimeout(function() { testMemory(trial) }, 3500);

  }
}
