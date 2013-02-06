// ## Helper functions

// Shows slides. 
function showSlide(id) {
  // Hide all slides
	$(".slide").hide();
	// Show just the slide we want to show
	$("#"+id).show();
}

// Get random integers. Behaves like numpy.randint without the size parameter.
function randint(a, b) {
	if (typeof b == "undefined") {
		a = a || 2;
		return Math.floor(Math.random() * a);
	} else {
		return Math.floor(Math.random() * (b-a+1)) + a;
	}
}


// Add a random selection function to all arrays 
// (e.g., <code>[4,8,7].random()</code> could return 4, 8, or 7).
// This is useful for condition randomization.
Array.prototype.random = function() {
  return this[randint(this.length)];
}


// Set up the trials, which is randomized across participants
// subject to the constraint that paired arrays can't appear sequentially
var trials = [];
var used_trials = [];
while (trials.length < design.length) {
    to_use = randint(design.length);
    if (used_trials.indexOf(to_use) == -1) {
        this_trial = design[to_use];
        this_id = this_trial.id;
        last_index = trials.length -1
        last_id = last_index > -1 ? trials[last_index].id : "whatever";
        if (this_id != last_id) {
            trials.push(this_trial);
        }
    }
}
// Show the instructions slide -- this is what we want subjects to see first.
showSlide("instructions");

// Set up the things we'll need for the main experiment
stim = $("canvas")[0].getContext("2d")

fillBG = function(){
    stim.fillStyle = "gray";
    stim.fillRect(0, 0, stim.canvas.width, stim.canvas.height);
}

drawCircle = function(x, y, d, color){
    stim.beginPath();
    stim.arc(x, y, d / 2, 0, 2 * Math.PI);
    stim.closePath();
    stim.fillStyle = color;
    stim.fill();
}

drawArray = function(trialData){
    n_circles = trialData.sizes.length;
    fillBG();
    for (i = 0; i < n_circles; i++) {
        drawCircle(trialData.xlocs[i],
                   trialData.ylocs[i],
                   trialData.sizes[i],
                   trialData.colors[i]);
    }
}

var testData = {};
sizeSlider = function(evt){
    curPos = evt.pageY;
    newSize = testData.origSize - (curPos - mouseStart);
    window.testData.curSize = newSize
    fillBG()
    drawCircle(testData.xloc,
               testData.yloc,
               testData.curSize,
               "black")
    document.onmouseclick = saveSize;
}

var mouseStart = null;
startSliding = function(evt){
    window.mouseStart = evt.pageY;
    document.onmousemove = sizeSlider;
}

saveSize = function(evt){
    document.onmousemove = null;
}

// Here's the top-level function for all this business that
// actually gets executed by the experiment code
testMemory = function(trialData){
    fillBG();
    window.testData.xloc = trialData.targ_xloc;
    window.testData.yloc = trialData.targ_yloc;
    window.testData.origSize = randint(10, 85);
    drawCircle(testData.targ_xloc,
               testData.targ_yloc,
               testData.origSize,
               "black");
    document.onmousemove = startSliding;
}

wait = function(msec){
    setTimeout(function() {return null}, msec);
}


var experiment = {

  trials: trials, 

  // Set up an empty array to store the experimental data as we go
  data: [],

  // The end function completes the experiment and submits to Turk
  end: function() {
    showSlide("finished");
    setTimeout(function() { turk.submit(old_experiment) }, 1500);
  },


  // The next function is called on each trial
  // Basic stages are sample, delay, test
  // Each of these stages has its own funtion to do the bulk of the work
  next: function() {
 
    showSlide("stimulus");
    trial = experiment.trials.shift();

    fillBG();
    wait(1000);

    // draw some circles
    drawArray(trial)
    wait(1500);
    
    fillBG();
    wait(1000);

    // 
    testMemory(trial);

  }
}
