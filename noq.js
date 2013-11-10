function noQ_id(p)
{
	return(p && ((p.promise && (p.promise == p)) || (p instanceof Promise)));
}

Promise.prototype =
{
	resolve: function noQ_Promise_resolve(r)
	{
		return(this.__complete(r, true));
	},
	reject: function noQ_Promise_reject(r)
	{
		return(this.__complete(r, false));
	},
	then: function noQ_Promise_then(p, n)
	{
		if(this.__val === undefined)
		{
			(this.__c || (this.__c = [])).push({p: p, n: n});
			if(n)
				this.fail(n);
		}
		else if(this.__val === true)
			p(this.__res);
		else if(n && (this.__val === false))
			n(this.__res);
		return(this);
	},
	fail: function noQ_Promise_fail(n)
	{
		if(this.__val === undefined)
			(this.__c || (this.__c = [])).push({p: undefined, n: n});
		else if(n && (this.__val === false))
			n(this.__res);
		return(this);
	},
	__seq: function noQ_callSequence(chain)
	{
		var f, h, recurse = arguments.callee;
		while(f = chain.shift())
		{
			if(!(h = this.__val? f.p : f.n)) continue;
			try
			{
				var t = this, r = h(this.__res);	//call the handler
				this.__val = true;	//unless an exception is thrown, the promise is positively resolved
				if(noQ_id(r))
				{
					this.__val = this.__res = null;
					return(r.then(function noQ_callSequence_chain_then(pr)
					{
						recurse.call(t, chain, t.__val = true, t.__res = pr);
					}, function noQ_callSequence_chain_fail(pr)
					{
						recurse.call(t, chain, t.__val = false, t.__res = pr);
					}));	//chain
				}
				else
					this.__res = r;
			}
			catch(e)
			{
				this.__val = false;
				this.__res = e;
			}
		}
	},
	__complete: function noQ_complete(r, disposition)
	{
		if(this.__val !== undefined)
			throw(new Error("Attempt to resolve or reject a promise twice."));

		var t = this, c = function(cr, d)
		{
			t.__seq(t.__c || [], t.__val = d, t.__res = cr);
		};
		if(noQ_id(r))
		{
			this.__val = "(chain)";
			r.then(function(cr){c(cr, true);}, function(cr){c(cr, false);});
		}
		else
			c(r, disposition);
		
		return(this);
	}
};
function Promise(initialState, resolution)
{
	this.promise = this;	//compatibility with kriskowal's Q
	if((initialState === true) || (initialState === false))
	{
		this.__val = initialState;
		this.__res = resolution;
	}
}

Promise_noTry.prototype = new Promise();	//Promise_noTry strictly extends Promise, but with a non-trying callSequence
Promise_noTry.prototype.__seq = function noQ_callSequence_noTry(chain)
{
	var f, h, recurse = arguments.callee;
	while(f = chain.shift())
	{
		if(!(h = this.__val? f.p : f.n)) continue;
		
		var t = this, r = h(this.__res);	//call the handler
		this.__val = true;	//default to positively resolved
		if(noQ_id(r))
		{
			this.__val = this.__res = null;
			return(r.then(function noQ_callSequence_noTry_chain_then(pr)
			{
				recurse.call(t, chain, t.__val = true, t.__res = pr);
			}, function noQ_callSequence_noTry_chain_fail(pr)
			{
				recurse.call(t, chain, t.__val = false, t.__res = pr);
			}));	//chain
		}
		else
			this.__res = r;
	}
};
function Promise_noTry()
{
	Promise.apply(this, arguments);
}

function noQ_api(promiseCtor)
{
	var api =
	{
		defer: function noQ_defer(v, r)		//return a promise in an unresolved state, optionally presolved with params v, r
		{
			return(new promiseCtor(v, r));
		},
		resolve: function noQ_resolve(r)	//return a 'presolved' promise in the positive state; the promise equivalent of true
		{
			return(this.defer(true, r));
		},
		reject: function noQ_reject(r)		//return a 'presolved' promise in the negative state; the promise equivalent of false
		{
			return(this.defer(false, r));
		},
		all: function noQ_all(a, p, n)		//return a promise combinator - resolves positively when all inputs are positive
		{									//or negatively when the first input is negative
			var d = this.defer(), count = (a && a.length) || 0, r = [];
			if(p)	d.then(p, n);
			if(count == 0)	return(d.resolve([]));
			a.forEach(function(o, i)
			{
				o.then(function noQ_all_then(v)
				{
					r[i] = v;
					if(--count == 0)	d.resolve(r);
				},
				function noQ_all_fail(v)
				{
					d.reject(v);
				});
			});
			return(d);
		}	
	}
	return(api);
}

var API_try = noQ_api(Promise);
var API_noTry = noQ_api(Promise_noTry);
API_try.doTry = API_noTry.doTry = API_try;		//return a version of the API with kriskowal/q-style exception absorption
API_try.noTry = API_noTry.noTry = API_noTry;	//return a version of the API with no exception absorption for better debugging

module.exports = API_try;	//default to the try-implementing API for compatibility
