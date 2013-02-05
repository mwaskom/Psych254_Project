// ## Helper functions

// Shows slides. 
function showSlide(id) {
  // Hide all slides
	$(".slide").hide();
	// Show just the slide we want to show
	$("#"+id).show();
}

// Get random integers.
// When called with no arguments, it returns either 0 or 1.
// When called with one argument, *a*, it returns a number in {*0, 1, ..., a-1*}.
// When called with two arguments, *a* and *b*, returns a random value in 
// {*a*, *a + 1*, ... , *b*}.
function randint(a, b) {
	if (typeof b == "undefined") {
		a = a || 2;
		return Math.floor(Math.random() * a);
	} else {
		return Math.floor(Math.random() * (b-a+1)) + a;
	}
}

// Draw from a gaussian distribution with optional mean and var
// (mean, var default to 0, 1)
function randn(mu, sigma2) {
	var x1, x2, rad;
 
	do {
		x1 = 2 * Math.random() - 1;
		x2 = 2 * Math.random() - 1;
		rad = x1 * x1 + x2 * x2;
	} while(rad >= 1 || rad == 0);
 
	if (typeof mu == "undefined") {
		mu = 0;
        }
	if (typeof sigma2 == "undefined") {
		sigma2 = 1;
        }
	var c = Math.sqrt(-2 * Math.log(rad) / rad);
     	X = x1 * c;
        X = mu + Math.sqrt(sigma2) * X;

    return X;
};


// Add a random selection function to all arrays 
// (e.g., <code>[4,8,7].random()</code> could return 4, 8, or 7).
// This is useful for condition randomization.
Array.prototype.random = function() {
  return this[randint(this.length)];
}

// ## Configuration settings
var allKeyBindings = [
      {"p": "odd", "q": "even"},
      {"p": "even", "q": "odd"} ],
    allTrialOrders = [
      [1,3,2,5,4,9,8,7,6],
      [8,4,3,7,5,6,2,1,9] ],
    myKeyBindings = allKeyBindings.random(),
    myTrialOrder = allTrialOrders.random(),
    pOdd = (myKeyBindings["p"] == "odd");
    
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

var origSize = 50;
sizeSlider = function(evt){
    curPos = evt.pageY
    newSize = origSize - (curPos - mouseStart);
    fillBG()
    drawCircle(200, 200, newSize, "dodgerblue")
}

var mouseStart = null;
startSliding = function(evt){
    window.mouseStart = evt.pageY;
    document.onmousemove = sizeSlider;
}

// Here's the top-level function for all this business that
// actually gets executed by the experiment code
testMemory = function(){

}


var experiment = {

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

    fillBG()
    // draw some circles

    // Do the 
    fillBG()
    setTimeout(testMemory, 1500)

  }
}

var old_experiment = {
  // Parameters for this sequence.
  trials: myTrialOrder,
  // Experiment-specific parameters - which keys map to odd/even
  keyBindings: myKeyBindings,
  // The work horse of the sequence - what to do on every trial.
  next: function() {
    // Get the current trial
    var n = old_experiment.trials.shift();
    // If the current trial is undefined, we're done
    if (typeof n == "undefined") {
      return old_experiment.end();
    }
    
    // Compute the correct answer.
    var realParity = (n % 2 == 0) ? "even" : "odd";
    
    showSlide("stage");
    // Display the number stimulus.
    var colors = Array("firebrick", "darkgreen", "midnightblue");
    color = colors.random()
    // Just try drawing some circles for now

    var viewer = $("canvas")[1];
    var circle = drawCircle(viewer, 300, 200, 50, color);
    changeSize = function(evt){
        //circle.scale(2, 2);
        r = viewer.height - evt.pageY;
        console.log(r)
        drawCircle(viewer, 300, 200, r, color);
    }
    //document.onmousemove = changeSize;
    //setTimeout("var evt = {pageX: .5}; changeSize(evt);", 50)

    //setTimeout(experiment.next, 1000);
    //$(document).mousemove(changeSize);
    //$(document).onclick(experiment.next());
  }
}
