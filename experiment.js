// I'm implementing the experiment using a data structure that I call a **sequence**. The insight behind sequences is that many experiments consist of a sequence of largely homogeneous trials that vary based on a parameter. For instance, in this example experiment, a lot stays the same from trial to trial - we always have to present some number, the subject always has to make a response, and we always want to record that response. Of course, the trials do differ - we're displaying a different number every time. The idea behind the sequence is to separate what stays the same from what differs - to **separate code from data**. This results in **parametric code**, which is much easier to maintain - it's simple to add, remove, or change conditions, do randomization, and do testing.

// ## High-level overview
// Things happen in this order:
// 
// 1. Compute randomization parameters (which keys to press for even/odd and trial order), fill in the template <code>{{}}</code> slots that indicate which keys to press for even/odd, and show the instructions slide.
// 2. Set up the experiment sequence object.
// 3. When the subject clicks the start button, it calls <code>experiment.next()</code>
// 4. <code>experiment.next()</code> checks if there are any trials left to do. If there aren't, it calls <code>experiment.end()</code>, which shows the finish slide, waits for 1.5 seconds, and then uses mmturkey to submit to Turk.
// 5. If there are more trials left, <code>experiment.next()</code> shows the next trial, records the current time for computing reaction time, and sets up a listener for a key press.
// 6. The key press listener, when it detects either a P or a Q, constructs a data object, which includes the presented stimulus number, RT (current time - start time), and whether or not the subject was correct. This entire object gets pushed into the <code>experiment.data</code> array. Then we show a blank screen and wait 500 milliseconds before calling <code>experiment.next()</code> again.

// ## Helper functions

// Shows slides. We're using jQuery here - the **$** is the jQuery selector function, which takes as input either a DOM element or a CSS selector string.
function showSlide(id) {
  // Hide all slides
	$(".slide").hide();
	// Show just the slide we want to show
	$("#"+id).show();
}

// Get random integers.
// When called with no arguments, it returns either 0 or 1. When called with one argument, *a*, it returns a number in {*0, 1, ..., a-1*}. When called with two arguments, *a* and *b*, returns a random value in {*a*, *a + 1*, ... , *b*}.
function random(a,b) {
	if (typeof b == "undefined") {
		a = a || 2;
		return Math.floor(Math.random()*a);
	} else {
		return Math.floor(Math.random()*(b-a+1)) + a;
	}
}

// Add a random selection function to all arrays (e.g., <code>[4,8,7].random()</code> could return 4, 8, or 7). This is useful for condition randomization.
Array.prototype.random = function() {
  return this[random(this.length)];
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
    
// Fill in the instructions template using jQuery's <code>html()</code> method. In particular,
// let the subject know which keys correspond to even/odd. Here, I'm using the so-called **ternary operator**, which is a shorthand for <code>if (...) { ... } else { ... }</code>

$("#odd-key").html(pOdd ? "P" : "Q");
$("#even-key").html(pOdd ? "Q" : "P");

// Show the instructions slide -- this is what we want subjects to see first.
showSlide("instructions");


// ## The main event
// I implement the sequence as an object with properties and methods. The benefit of encapsulating everything in an object is that it's conceptually coherent (i.e. the <code>data</code> variable belongs to this particular sequence and not any other) and allows you to **compose** sequences to build more complicated experiments. For instance, if you wanted an experiment with, say, a survey, a reaction time test, and a memory test presented in a number of different orders, you could easily do so by creating three separate sequences and dynamically setting the <code>end()</code> function for each sequence so that it points to the next. **More practically, you should stick everything in an object and submit that whole object so that you don't lose data (e.g. randomization parameters, what condition the subject is in, etc). Don't worry about the fact that some of the object properties are functions -- mmturkey (the Turk submission library) will strip these out.**

var experiment = {
  // Parameters for this sequence.
  trials: myTrialOrder,
  // Experiment-specific parameters - which keys map to odd/even
  keyBindings: myKeyBindings,
  // An array to store the data that we're collecting.
  data: [],
  // The function that gets called when the sequence is finished.
  end: function() {
    // Show the finish slide.
    showSlide("finished");
    // Wait 1.5 seconds and then submit the whole experiment object to Mechanical Turk (mmturkey filters out the functions so we know we're just submitting properties [i.e. data])
    setTimeout(function() { turk.submit(experiment) }, 1500);
  },
  // The work horse of the sequence - what to do on every trial.
  next: function() {
    // Get the current trial - <code>shift()</code> removes the first element of the array and returns it.
    var n = experiment.trials.shift();
    // If the current trial is undefined, it means the trials array was empty, which means that we're done, so call the end function.
    if (typeof n == "undefined") {
      return experiment.end();
    }
    
    // Compute the correct answer.
    var realParity = (n % 2 == 0) ? "even" : "odd";
    
    showSlide("stage");
    // Display the number stimulus.
    $("#number").html(n);
    
    // Get the current time so we can compute reaction time later.
    var startTime = (new Date()).getTime();

    
    // Set up a function to react to keyboard input. Functions that are used to react to user input are called *event handlers*. In addition to writing these event handlers, you have to *bind* them to particular events (i.e., tell the browser that you actually want the handler to run when the user performs an action). Note that the handler always takes an <code>event</code> argument, which is an object that provides data about the user input (e.g., where they clicked, which button they pressed).
    var keyPressHandler = function(event) {
      // A slight disadvantage of this code is that you have to test for numeric key values; instead of writing code that expresses "*do X if 'Q' was pressed*", you have to do the more complicated "*do X if the key with code 80 was pressed*". A library like [Keymaster][keymaster], or [zen][zen] (my library, and a work in progress) lets you write simpler code like <code>key('a', function(){ alert('you pressed a!') })</code>, but I've omitted it here. Here, we get the numeric key code from the event object
      // [keymaster]: http://github.com/madrobby/keymaster
      // [zen]: http://github.com/longouyang/zenjs
      var keyCode = event.which;
      
      if (keyCode != 81 && keyCode != 80) {
        // If a key that we don't care about is pressed, re-attach the handler (see the end of this script for more info)
        $(document).one("keydown", keyPressHandler);
        
      } else {
        // If a valid key is pressed (code 80 is p, 81 is q),
        // record the reaction time (current time minus start time), which key was pressed, and what that means (even or odd).
        var endTime = (new Date()).getTime(),
            key = (keyCode == 80) ? "p" : "q",
            userParity = experiment.keyBindings[key],
            data = {
              stimulus: n,
              accuracy: realParity == userParity ? 1 : 0,
              rt: endTime - startTime
            };
        
        experiment.data.push(data);
        // Temporarily clear the number.
        $("#number").html("");
        // Wait 500 milliseconds before starting the next trial.
        setTimeout(experiment.next, 500);
      }
    };
    
    // Here, we actually bind the handler. We're using jQuery's <code>one()</code> function, which ensures that the handler can only run once. This is very important, because generally you only want the handler to run only once per trial. If you don't bind with <code>one()</code>, the handler might run multiple times per trial, which can be disastrous. For instance, if the user accidentally presses P twice, you'll be recording an extra copy of the data for this trial and (even worse) you will be calling <code>experiment.next</code> twice, which will cause trials to be skipped! That said, there are certainly cases where you do want to run an event handler multiple times per trial. In this case, you want to use the <code>bind()</code> and <code>unbind()</code> functions, but you have to be extra careful about properly unbinding.
    $(document).one("keydown", keyPressHandler);
    
  }
}
