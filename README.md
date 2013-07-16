**noQ**: Micro promises library, designed for full compatibility with a the most common subset
of the ['q' library](http://github.com/kriskowal/q) which is complete enough for most use cases.

##What Makes noQ different
noQ differs in two primary regards: predictability of function and configurable exception absorption.

**kriskowal/q**'s main shortcoming is that it's easy to get into hard-to-debug failure cases.  Most
often this is caused by mundane runtime exceptions being swallowed up by the promises library and flowing
down the promise rejection path.  While this is good for overall stability, it makes development work
more difficult.  **noQ**'s API object has a `noTry` property that returns an API variation identical except
for the fact that it doesn't absorb exceptions.  It is perfectly suitable for production code and forces you
to properly use `try {} catch` constructs where needed.  If you'd like an extra diaper on your code, the
normal API is perfect (alternately, a `doTry` property is exposed to allow switching back to the `try` API.)

	var Q = require('noq').noTry;	 		//returns a no-try API (recommended)
	
	var alternately = require('noq');		//returns the 'q'-style exception-absorbing API

	var changedMyMind = Q.doTry;			//another way to access the exception-absorbing API


**noQ** also features several subtle but very useful improvements to **q** - promise constants
(also known as ***presolved*** promises), decreased redundancy and better degenerate `Q.all()` functionality.

###***Presolved*** promises

**noQ** introduces the concept of pre-resolved promises which are initially in the ***resolved*** or
***rejected*** states from their inception.  They can be thought of as the promise equivalent of `true` and
`false` (respectively.)  This allows you to write simpler code because conditional code branches can be
handled inline elegantly:

	(needToPutShoesOn? putShoesOn("newbalance") : Q.resolve(existingComfort))
		.then(function shoesOn(comfort)
		{
			//ahh

			return(presentWWDCKeynote());
		});

While it's possible to achieve equivalent function by making `putShoesOn` idempotent, it's not always the
most sensible functionality.  Alternately, the body of completion routine `shoesOn(comfort)` could be invoked
as the junction of promise-following and direct code paths, but that results in messy code that's harder to read.

	showiPhone4Safari("wifi").then(function()
	{
		console.log("so that's Safari on the iPhone 4")
		return(philSchillersBit());

	}).fail(function()
	{
		console.log("There are 570 WiFi base stations operating in this room. We can't deal with that.");

		return(Q.reject("nowifi"));		//with the 'q' library, you would have to throw here
	});

Returning a pre-rejected promise in this failure handler solves a limitation in the original **q** library too
where you would have to throw an error to propagate control to the next failure handler.  **noQ** offers this
approach to right better cascade failure handlers without resorting to `throw` and `try {} catch` blocks.

###Redundancy removed

The **q** module requires you to use the `.promise` property as the ***thenable*** component of the promise, which
they define as the object upon which you can add `.then()` and `.fail()` handlers.  **noQ** dispenses with this redundancy
and allows you to use a single object as the promise.  The `.promise` property is maintained for compatibility but is
not required.

	function shipWhiteiPhone4s()
	{
		var aPromise = Q.defer();

		setTmeout(function whew()
		{
			aPromise.resolve("finally");

		}, (300 * 86400 * 1000) );	//delayed 10 months

		return(aPromise);	//note no need to return aPromise.promise
	}

	shipWhiteiPhone4s.then(function buyOne()
	{
		//goto appleStore;

	});


###Subtle improvement to `Q.all()`

In **q**, calling Q.all() with no argument or `undefined` results in undefined behaviour.
In **noQ**, these degenerate modes are defined as equivalent to passing an empty array, which makes the completion
handler run right away.

	Q.all().then(function(responses)
	{
		//responses.length = 0
	})

	Q.all(undefined).then(function(responses)
	{
		//responses.length = 0
	})

	Q.all([]).then(function(responses)
	{
		//responses.length = 0
	})

Whereas:

	Q.all([Q.resolve()]).then(function(responses)
	{
		//responses.length = 1
		//responses[0] = undefined
	})

And of course:

	Q.all([Q.resolve("newMacPro")]).then(function(responses)
	{
		//responses.length = 1
		//responses[0] = "newMacPro"
	})
