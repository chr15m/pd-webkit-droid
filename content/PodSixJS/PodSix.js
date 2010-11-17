/**********************************************

        PodSix Javascript Library

        Copyright Chris McCormick, 2007, 2008
        chris@podsix.com.au
        All rights reserved.

**********************************************/

var PodSix;

( function()
	{ // Using a closure to keep global namespace clean.
		if (PodSix == null) PodSix = new Object();
		
		/*
			Callbacks table for doing 
		*/
		PodSix.callback = {};
		PodSix.ids = {};
		
		/*
			Make a new ID that hasn't been used by PodSix lib yet.
		*/
		PodSix.NewID = function()
		{
			id = 0;
			do
			{
				id = Math.random();
			} while (PodSix.ids[id]);
			return id;
		};

		/*
			Register a callback by id.
		*/
		PodSix.RegisterCallback = function(callback)
		{
			var id = PodSix.NewID();
			PodSix.callback[id] = callback;
			return id;
		};
		
		/* 
			Some kind of basic inheritance.
		*/
		PodSix.Inherit = function(c1, c2)
		{
			for (c in c2)
				c1[c] = c2[c];
		}
		
		/*
			Generic debugging function that will spit out debugging info into a DIV that sits on top of everything else.
		*/
		var debug = PodSix.Debug = function(txt)
		{
			var w = document.getElementById("PodSix.debug");
			if (!w)
			{
				w = document.createElement("div");
				w.id = "PodSix.debug";
				w.style.border = "1px solid black";
				w.style.zIndex = 9999;
				w.style.position = 'absolute';
				w.style.backgroundColor = "white";
				w.style.left = "0px";
				w.style.top = "0px";
				w.style.width = "100%";
				document.getElementsByTagName("BODY")[0].appendChild(w);
			}
			
			if (w)
				w.innerHTML += txt + "<br/>";
		}
		
		/* 
			Clear the debug window.
		*/
		PodSix.ClearDebug = function()
		{
			var d = document.getElementById("PodSix.debug");
			if (d)
				d.innerHTML = "";
		}
		
		/*
			Basic Vector type.
		*/
		PodSix.Vector = function(data)
		{
			this.e = function(i)
			{
				return this.data[i];
			}
			
			this.SetVector = function (a)
			{
				this.data = (a.data || a).slice();
			}
			
			this.toString = function ()
			{
				return '[' + this.data.join(', ') + ']';
			}
			
			this.add = function(v)
			{
				var V = v.data || v;
				nV = [];
				
				for (x in this.data)
					nV[x] = this.data[x] + V[x];
				return new PodSix.Vector(nV);
			}
			
			this.sub = function(v)
			{
				var V = v.data || v;
				nV = [];
				
				for (x in this.data)
					nV[x] = this.data[x] - V[x];
				return new PodSix.Vector(nV);
			}
			
			this.mul = function(i)
			{
				nV = [];
				for (x in this.data)
					nV[x] = this.data[x] * i;
				return new PodSix.Vector(nV);
			}
			
			this.length = function()
			{
				total = 0;
				for (x in this.data)
					total += Math.pow(this.data[x], 2);
				return Math.pow(total, 0.5);
			}

			this.unit = function()
			{
				nv = [];
				for (x in this.data)
					nV[x] = this.data[x] / this.length();
				return new PodSix.Vector(nV);
			}
			
 /* // Returns the result of subtracting the argument from the vector

  // Returns the result of multiplying the elements of the vector by the argument
  multiply: function(k) {
    return this.map(function(x) { return x*k; });
  },

  x: function(k) { return this.multiply(k); },

  // Returns the scalar product of the vector with the argument
  // Both vectors must have equal dimensionality
  dot: function(vector) {
    var V = vector.elements || vector;
    var i, product = 0, n = this.elements.length;
    if (n != V.length) { return null; }
    do { product += this.elements[n-1] * V[n-1]; } while (--n);
    return product;
  },

  // Returns the vector product of the vector with the argument
  // Both vectors must have dimensionality 3
  cross: function(vector) {
    var B = vector.elements || vector;
    if (this.elements.length != 3 || B.length != 3) { return null; }
    var A = this.elements;
    return Vector.create([
      (A[1] * B[2]) - (A[2] * B[1]),
      (A[2] * B[0]) - (A[0] * B[2]),
      (A[0] * B[1]) - (A[1] * B[0])
    ]);
  },
*/
			
			if (data)
				this.SetVector(data);
		}
		
		/* 
			Recursive dimensional clustering
			
			Pass in an array that looks like this:
			[[leading1, trailing1], [leading2, trailing2], [leading3, trailing3]...]
			
			leading1 is the function that returns the leading edge of an axis bounding box.
			trailing1 is the function that returns the trailing edge of an axis bounding box.
		*/
		PodSix.RDC = function(axisFunctions)
		{
			// Array of functions that contain the sort and position functions for each axis
			this.axisFns = axisFunctions;
			// which axis we are currently checking on in this pass
			this.idx = 0;
			// test if there has been a division or not
			this.divided = true;
			
			var Boundary = function(type, position, obj)
			{
    				this.type = type;
				this.position = position;
				this.obj = obj;
			}
			
			this.DoSort = function(clusters, axis)
			{
				// we're going to replace all clusters with new found ones
				var newclusters = [];
				// assume that we won't divide any further
				this.divided = false;
				
				// for every sub cluster in our group of clusters
				for (c in clusters)
				{
					var boundaries = [];
					var count = 0;
					var group = [];
					
					// store the intervals for a given axis in a list data structure
					for (i in clusters[c])
					{
						obj = clusters[c][i];
						boundaries.push(new Boundary('o', obj[axis[0]](), obj));
						boundaries.push(new Boundary('c', obj[axis[1]](), obj));
						debug.innerHTML += obj[axis[0]]() +"," + obj[axis[1]]() + "</br>";
					}
					
					// sort our list of all boundaries on position
					boundaries.sort(function(a, b) { return a.position - b.position });
					
					// finally, make new chunks out of our existing collection
					for (i = 0; i < boundaries.length; i++)
					{
						b = boundaries[i];
						// if we find a leading edge, increment our count
						// and push it onto our stack of the current group
						if (b.type == "o")
						{
							count++;
							group.push(b.obj);
						}
						else if (b.type = "c")
						{
							count--;
							// if we have finished finding a group
							// push this group onto the stack on new clusters
							// empty out our group
							if (count == 0)
							{
								newclusters.push(group);
								group = [];
								// if we're not at the very end of our array then we've just made a new subdivision
								if (i != boundaries.length - 1)
								{
									this.divided = true;
								}
							}
						}
					}
				}
				
				return newclusters;
			}
			
			this.FindGroups = function(group)
			{
				var clusters = [group];
				while (this.divided)
				{
					// find the new clusters
					clusters = this.DoSort(clusters, this.axisFns[this.idx]);
					// select the next axis for subdivision
					this.idx = (this.idx + 1) % this.axisFns.length;
				}
				return clusters;
			}
		}
		
		/*
			Bruteforce collision detection.
			Pass in an array of objects, and an array that looks like this:
			[[leading1, trailing1], [leading2, trailing2], [leading3, trailing3]...]
			
			leading1 is the function that returns the leading edge of an axis bounding box.
			trailing1 is the function that returns the trailing edge of an axis bounding box.

			You can pass in the name of the collide method too.
		*/
		PodSix.BruteForceRectangles = function(group, axisFns)
		{
			for (var i = 0; i < group.length; i++)
			{
				for (var j = i + 1; j < group.length; j++)
				{
					collided = true;
					for (a in axisFns)
					{
						if (group[i][axisFns[a][0]]() > group[j][axisFns[a][1]]()) collided = false;
						if (group[j][axisFns[a][0]]() > group[i][axisFns[a][1]]()) collided = false;
					}
					
					if (collided)
					{
						group[i].Collide(group[j]);
						group[j].Collide(group[i]);
					}
				}
			}
		}
		
		/*
			This does a brute force of one small subset against another small subset.
		*/
		PodSix.BruteForceGroups = function(group1, group2, axisFns)
		{
			for (var i = 0; i < group1.length; i++)
			{
				for (var j = 0; j < group2.length; j++)
				{
					collided = true;
					for (a in axisFns)
					{
						if (group[i][axisFns[a][0]]() > group[j][axisFns[a][1]]()) collided = false;
						if (group[j][axisFns[a][0]]() > group[i][axisFns[a][1]]()) collided = false;
					}
					
					if (collided)
					{
						group[i].Collide(group[j]);
						group[j].Collide(group[i]);
					}
				}
			}
		}
	}
)();

// Code for doing remote SQL calls to the server (and other remote stuff)
/*
function RPC(url, callback)
{
	var req = null;
	var callback = callback;
	this.url = url;
	
	// wrapper to call the supplied callback when the response is received
	this.internalCallback = function()
	{
		// only if req shows "loaded"
		if (req.readyState == 4)
		{
			// only if "OK"
			if (req.status == 200)
			{
				if (req.responseText.indexOf("Mod_python error") >= 0)
					alert(req.responseText);
				else
					callback(req.responseText);
			}
			else
			{
				// alert("There was a problem retrieving the XML data:\n" + req.statusText);
			}
		}
	}
	
	// set up and make the call
	this.Fetch = function()
	{
		// XMLHttpRequest object
		if (window.XMLHttpRequest)
		{
			req = new XMLHttpRequest();
			req.onreadystatechange = this.internalCallback;
			req.open("GET", this.url, true);
			req.send(null);
		} 
		// ActiveX object
		else if (window.ActiveXObject)
		{
			req = new ActiveXObject("Microsoft.XMLHTTP");
			if (req)
			{
				req.onreadystatechange = this.internalCallback;
				req.open("GET", this.url, true);
				req.send();
			}
		}
	}
}
*/
