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

//-- Functions related to control over experimental stimuli

fillBG = function(){
  //Fill in the canvas background with a light gray
  stim.fillStyle = "#cccccc";
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
  window.testData.xloc = trialData.targ_xloc;
  window.testData.yloc = trialData.targ_yloc;
  window.testData.origSize = randint(10, 85);
  curIndex = experiment.data.length - 1;
  experiment.data[curIndex].orig_test_size = testData.origSize;
  experiment.data[curIndex].report_start = (new Date()).getTime();
  fillBG();
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
    window.mouseStart = evt.pageY;
  }

  curPos = evt.pageY;
  newSize = testData.origSize - (curPos - window.mouseStart);
  testData.curSize = newSize;
  fillBG();
  drawCircle(testData.xloc,
             testData.yloc,
             testData.curSize,
             "black");
}

saveSize = function(evt){
  //Lock in the response about the test stimulus size  
  document.onmousemove = null;
  document.onmousedown = null;
  window.mouseStart = null;
  curIndex = experiment.data.length - 1;
  experiment.data[curIndex].report_size = testData.curSize;
  experiment.data[curIndex].report_finish = (new Date()).getTime();
  showSlide("advancer");
  //experiment.next();
}

//-- Global variables (probably needed because I am bad at Javasvript)
var testData = {};
var mouseStart = null;
var stim = $("canvas")[0].getContext("2d")
var instructStart = (new Date()).getTime();

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
      used_trials.push(to_use);
    }
  }
}

//Handle turk preview mode
if (turk.previewMode) {
  $("#startButton").attr("disabled", true);
}

// Show the instructions slide
showSlide("instructions");

//Define the main object that controls the rest of the experiment
var experiment = {

  //Information about what should happen
  trials: trials, 

  //Information about what did happen
  data: [],

  start: function(){
    //Show the reminder and begin experiment
    this.instruct_start = instructStart
    this.instruct_end = (new Date()).getTime();
    this.next();
    //setTimeout(this.next, 1500);
  },

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
    trial_str = trials.length == 1 ? " trial" : " trials";
    $("#trials_left").html(trials.length + trial_str + " to go!");

    //Go through the stages of the trial
    fillBG();
    setTimeout(function() { drawArray(trial) }, 1000);
    setTimeout(fillBG, 2500);
    setTimeout(function() { testMemory(trial) }, 3500);

  }
}
