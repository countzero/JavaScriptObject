/*
Name:       JavaScriptObject
Version:    0.9.1 (August 11 2009)
Author:     Finn Rudolph
Support:    http://finnrudolph.de/JavaScriptObject

Licence:    ImageFlow is licensed under a Creative Commons 
            Attribution-Noncommercial 3.0 Unported License 
            (http://creativecommons.org/licenses/by-nc/3.0/).

            You are free:
                + to Share - to copy, distribute and transmit the work
                + to Remix - to adapt the work

            Under the following conditions:
                + Attribution. You must attribute the work in the manner specified by the author or licensor 
                  (but not in any way that suggests that they endorse you or your use of the work). 
                + Noncommercial. You may not use this work for commercial purposes. 

            + For any reuse or distribution, you must make clear to others the license terms of this work.
            + Any of the above conditions can be waived if you get permission from the copyright holder.
            + Nothing in this license impairs or restricts the author's moral rights.

Credits:    This script uses the JavaScriptObjectDomReadyEvent from Tanny O'Haley [1] and the 
            getElementsByClass function by Dustin Diaz [2].

            [1] http://tanny.ica.com/ICA/TKO/tkoblog.nsf/dx/domcontentloaded-for-browsers-part-v
            [2] http://www.dustindiaz.com/getelementsbyclass
*/

/* JavaScriptObject constructor */
function JavaScriptObject ()
{
	/* Closure for this */
	var thisObject = this;

	/* Initiate JavaScriptObject */
	this.init = function(objectID)
	{
		this.objectID = objectID;

		/* Try to get JavaScriptObject image element */
		var objectImage = document.getElementById(thisObject.objectID);
		if(objectImage)
		{
			/* Extract image path, type and the row and col to start with from src attribute */
			var imageSrc = objectImage.getAttribute('src');
			var imagePath = imageSrc.match('.*\/');
			var imageType = imageSrc.split('.');
			imagePath = imagePath[0];
			var imageFileName = imageType[imageType.length-2].split('/');
			imageFileName = imageFileName[imageFileName.length-1].split('_');
			var startRow = parseFloat(imageFileName[imageFileName.length-2]);
			var startCol = parseFloat(imageFileName[imageFileName.length-1]);
			imageType = imageType[imageType.length-1];

			/* Evaluate settings from longdesc attribute */
			var objectSettings = objectImage.getAttribute('longdesc');
			var settingsArray = ['inverseX', 'inverseY', 'lazy'];
			var max = settingsArray.length;
			for(var i=0; i < max; i++)
			{
				this[settingsArray[i]] = false;
			}
			for(i=0, reg=''; i < max; i++)
			{
				reg = new RegExp(settingsArray[i]);
				if( objectSettings.match(reg) )
				{
					this[settingsArray[i]] = true;
				}
			}

			/* Extract object resolution (number of frames on X and Y-Axis) */
			objectSettings = objectSettings.split(' ');
			var imageWidth = parseFloat(objectImage.getAttribute('width'));
			var imageHeight = parseFloat(objectImage.getAttribute('height'));

			/* Store the given Object properties in an object ;D */
			this.Object = 
			{	
				element: objectImage,
				path: imagePath,
				type: imageType,
				height: imageHeight,
				width: imageWidth,
				name: objectImage.getAttribute('alt'),
				resY: objectSettings[0],
				resX: objectSettings[1],
				startRow: startRow,
				startCol: startCol
			};

			this.loadingFirstCheck = true;

			/* Display 'load object' link for lazy objects */
			if(thisObject.lazy)
			{
				this.Structure.lazy();
			}
			else
			{	
				/* Create XHTML structure */
				this.Structure.create();
			}
		}
	};

	/* Create HTML Structure */
	this.Structure =
	{
		create: function()
		{
			/* Get parent node of the initial image element */
			var parent = thisObject.Object.element.parentNode;

			/* Create images div container */
			var imagesDiv = document.createElement('div');
			imagesDiv.setAttribute('id',thisObject.objectID);
			imagesDiv.setAttribute('class','javascriptobject');
			imagesDiv.setAttribute('className','javascriptobject');
			imagesDiv.style.width = thisObject.Object.width + 'px';
			imagesDiv.style.height = thisObject.Object.height + 'px';

			/* Replace initial image node by images div container */
			parent.insertBefore(imagesDiv, thisObject.Object.element);
			parent.removeChild(thisObject.Object.element);

			/* Create a two dimensional array to handle the frames */
			var frameArray = [thisObject.Object.resY];
			for (var i=0; i < thisObject.Object.resY; i++)
			{
				frameArray[i] = [thisObject.Object.resX];
			}

			/* Create all image elements within the imagesDiv */
			var image = null;
			var row_str = '';
			for(var row = 0; row < thisObject.Object.resY; row++)
			{
				row_str = thisObject.Helper.leadingZero(row);
				for(var col = 0; col < thisObject.Object.resX; col++)
				{
					image = document.createElement('img');
					image.setAttribute('src',thisObject.Object.path+row_str+'_'+thisObject.Helper.leadingZero(col)+'.'+thisObject.Object.type);
					image.setAttribute('width',thisObject.Object.width);
					image.setAttribute('height',thisObject.Object.height);
					image.style.display = 'none';
					imagesDiv.appendChild(image);
					frameArray[row][col] = image;
				}
			}

			/* Create loading text container */
			var loadingP = document.createElement('p');
			var loadingText = document.createTextNode(' ');
			loadingP.setAttribute('id',thisObject.objectID+'_loading_txt');
			loadingP.appendChild(loadingText);

			/* Create loading div container */
			var loadingDiv = document.createElement('div');
			loadingDiv.setAttribute('id',thisObject.objectID+'_loading');
			loadingDiv.setAttribute('class','loading');
			loadingDiv.setAttribute('className','loading');

			/* Create loading bar div container inside the loading div */
			var loadingBarDiv = document.createElement('div');
			loadingBarDiv.setAttribute('id',thisObject.objectID+'_loading_bar');
			loadingBarDiv.setAttribute('class','loading_bar');
			loadingBarDiv.setAttribute('className','loading_bar');
			loadingDiv.appendChild(loadingBarDiv);

			/* Append */
			imagesDiv.appendChild(loadingP);
			imagesDiv.appendChild(loadingDiv);

			/* Set globals */
			thisObject.imagesDiv = document.getElementById(thisObject.objectID);
			thisObject.loadingDiv = document.getElementById(thisObject.objectID+'_loading');
			thisObject.loadingBar = document.getElementById(thisObject.objectID+'_loading_bar');
			thisObject.loadingP = document.getElementById(thisObject.objectID+'_loading_txt');

			/* Position the loading bar */
			thisObject.loadingP.style.paddingTop = ((thisObject.imagesDiv.offsetHeight * 0.5) -30) + 'px';

			/* Proceed if structure creation was successful */
			thisObject.frameArray = frameArray;
			if(thisObject.frameArray.length > 0)
			{
				/* Initiate loading progress */
				thisObject.Loading.init();
			}
		},

		lazy: function()
		{
			/* Get parent node of the initial image element */
			var parent = thisObject.Object.element.parentNode;

			/* Create lazy div container */
			var lazyDiv = document.createElement('div');
			lazyDiv.setAttribute('id',thisObject.objectID+'_lazy');
			lazyDiv.setAttribute('class','javascriptobject');
			lazyDiv.setAttribute('className','javascriptobject');
			lazyDiv.style.position = 'absolute';
			lazyDiv.style.width = thisObject.Object.width + 'px';
			lazyDiv.style.height = thisObject.Object.height + 'px';
			lazyDiv.style.textAlign = 'center';
			lazyDiv.style.zIndex = 1;

			/* Create 'load object' link */
			var lazyLink = document.createElement('a');
			var lazyText = document.createTextNode('Load Object');
			lazyLink.appendChild(lazyText);
			lazyLink.setAttribute('href','');
			lazyLink.style.height = thisObject.Object.height/2 + 'px';	
			lazyLink.style.paddingTop = thisObject.Object.height/2 + 'px';	
			lazyLink.appendChild(lazyText);

			/* Set link behaviour */
			lazyLink.onclick = function()
			{
				parent.removeChild(lazyDiv);
				thisObject.Structure.create();
				return false;
			};

			/* Write to DOM */
			lazyDiv.appendChild(lazyLink);
			parent.insertBefore(lazyDiv, thisObject.Object.element);
		}
	};

	/* Manage loading progress and initialize core components after loading */
	this.Loading =
	{
		init: function()
		{
			var p = thisObject.Loading.getStatus();

			if(p < 100 || thisObject.loadingFirstCheck === true)
			{
				/* Insert a short delay if the browser loads rapidly from its cache */
				if(thisObject.loadingFirstCheck === true && p == 100)
				{
					thisObject.loadingFirstCheck = false;
					window.setTimeout(thisObject.Loading.init, 100);
				}
				else
				{
					window.setTimeout(thisObject.Loading.init, 40);
				}
			}
			else
			{				
				/* Hide loading elements */
				thisObject.loadingP.style.display = 'none';
				thisObject.loadingDiv.style.display = 'none';

				/* Display start image */
				thisObject.frameArray[thisObject.Object.startRow][thisObject.Object.startCol].style.display = 'block';
	
				/* Initialize core components */
				thisObject.Mouse.init();
				thisObject.Renderer.init();

				/* Set Renderer to startRow and startCol */
				thisObject.Renderer.row = thisObject.Object.startRow;
				thisObject.Renderer.col = thisObject.Object.startCol;

				/* Calculate corresponding mouse coordinates for startRow and startCol */
				var stepX = thisObject.Object.width / (thisObject.Object.resX-1);
				var stopX = Math.round( stepX * thisObject.Object.startCol );

				if(thisObject.Object.resY > 1)
				{
					var stepY = thisObject.Object.height / (thisObject.Object.resY-1);
					var stopY = Math.round( stepY * thisObject.Object.startRow );
				}
				else
				{
					stopY = 0;
				}

				/* Set mouse coordinates */
				thisObject.Mouse.x = stopX;
				thisObject.Mouse.y = stopY;

				/* Inverse */
				if(thisObject.inverseX){ stopX = -(stopX - thisObject.Object.width); }
				if(thisObject.inverseY){ stopY = -(stopY - thisObject.Object.height); }

				thisObject.Mouse.stopX = stopX;
				thisObject.Mouse.stopY = stopY;	
			}
		},

		getStatus: function()
		{
			var max = thisObject.imagesDiv.childNodes.length;
			var i = 0, completed = 0;
			var image = null;
			for(var index = 0; index < max; index++)
			{
				image = thisObject.imagesDiv.childNodes[index];
				if (image && image.nodeType == 1 && image.nodeName == 'IMG')
				{
					if (image.complete === true)
					{
						completed++;
					}
					i++;
				}
			}

			/* Set loading bar and text to actual progress */
			var finished = Math.round((completed/i)*100);
			thisObject.loadingBar.style.width = finished+'%';
			var loadingTxt = document.createTextNode('loading frames '+completed+'/'+i);
			thisObject.loadingP.replaceChild(loadingTxt,thisObject.loadingP.firstChild);

			/* Return status */
			return finished;
		}
	};

	this.Renderer =
	{
		col: 0,
		row: 0,

		init: function()
		{
			/* Mouse events */
			thisObject.Helper.addEvent(thisObject.imagesDiv,'mousedown',thisObject.Renderer.start);
			thisObject.Helper.addEvent(document,'mouseup',thisObject.Renderer.stop);
			
			/* iPod Touch and iPhone events */
			thisObject.Helper.addEvent(thisObject.imagesDiv,'touchstart',thisObject.Renderer.start);
			thisObject.Helper.addEvent(document,'touchend',thisObject.Renderer.stop);
		},

		start: function()
		{
			thisObject.Renderer.interval = window.setInterval(thisObject.Renderer.loop, 10);
		},

		stop: function()
		{	
			window.clearInterval(thisObject.Renderer.interval);
		},

		loop: function()
		{
			/* Rotate object */
			thisObject.Renderer.rotate(thisObject.Mouse.x,thisObject.Mouse.y);
		},
		
		rotate: function(x,y)
		{
			x = Math.round(x / (thisObject.Object.width / (thisObject.Object.resX-1)));
			y = Math.round(y / (thisObject.Object.height / (thisObject.Object.resY-1)));
			
			/* Hide previous frame and display current */
			thisObject.frameArray[thisObject.Renderer.row][thisObject.Renderer.col].style.display = 'none';
			thisObject.frameArray[y][x].style.display = 'block';
			
			/* Set row and col to current */
			thisObject.Renderer.col = x;
			thisObject.Renderer.row = y;
		}
	};

	this.Mouse =
	{
		x: 0,
		y: 0,
		startX: 0,
		startY: 0,
		stopX: 0,
		stopY: 0,
		busy: false,

		/* Init mouse event listener */
		init: function()
		{
			/* Mouse events */
			thisObject.Helper.addEvent(thisObject.imagesDiv,'mousedown',thisObject.Mouse.start);
			thisObject.Helper.addEvent(document,'mousemove',thisObject.Mouse.getPosition);
			thisObject.Helper.addEvent(document,'mouseup',thisObject.Mouse.stop);
			
			/* iPod Touch and iPhone events */
			thisObject.Helper.addEvent(thisObject.imagesDiv,'touchstart',thisObject.Mouse.start);
			thisObject.Helper.addEvent(document,'touchmove',thisObject.Mouse.getPosition);
			thisObject.Helper.addEvent(document,'touchend',thisObject.Mouse.stop);
			
			/* Avoid text and image selection while dragging */
			thisObject.Helper.addEvent(thisObject.imagesDiv,'selectstart',thisObject.Helper.suppressBrowserDefault);
			thisObject.Helper.addEvent(thisObject.imagesDiv,'click',thisObject.Helper.suppressBrowserDefault);
		},

		/* Get mouse position within image - left top corner is [0,0] */
		getPosition: function(e)
		{
			if(thisObject.Mouse.busy === true)
			{
				var newX = -(thisObject.Helper.mouseX(e) - thisObject.Mouse.startX - thisObject.Mouse.stopX);
				var newY = -(thisObject.Helper.mouseY(e) - thisObject.Mouse.startY - thisObject.Mouse.stopY);

				/* Inverse the rotation direction */
				if(thisObject.inverseX){ newX = -(newX - thisObject.Object.width); }
				if(thisObject.inverseY){ newY = -(newY - thisObject.Object.height); }
				
				/* Map x-axis mouse coordinates in range of the object width */
				if(newX < 0)
				{
					if(thisObject.inverseX)
					{
						thisObject.Mouse.startX -= thisObject.Object.width;
					}
					else
					{
						thisObject.Mouse.startX += thisObject.Object.width;
					}
					newX = 0;
				}
				if(newX > thisObject.Object.width)
				{
					if(thisObject.inverseX)
					{
						thisObject.Mouse.startX += thisObject.Object.width;
					}
					else
					{
						thisObject.Mouse.startX -= thisObject.Object.width;
					}
					newX = 0;
				}

				/* Map y-axis mouse coordinates in range of the object height */
				if(newY < 0)
				{
					if(thisObject.inverseY)
					{
						thisObject.Mouse.startY -= thisObject.Object.height;
					}
					else
					{
						thisObject.Mouse.startY += thisObject.Object.height;
					}
					newY = 0;
				}
				if(newY > thisObject.Object.height)
				{
					if(thisObject.inverseY)
					{
						thisObject.Mouse.startY += thisObject.Object.height;
					}
					else
					{
						thisObject.Mouse.startY -= thisObject.Object.height;
					}
					newY = 0;
				}
				thisObject.Mouse.x = newX;
				thisObject.Mouse.y = newY;
				thisObject.Helper.suppressBrowserDefault(e);
			}
		},

		start: function(e)
		{
			// Set closedhand cursor
			thisObject.imagesDiv.style.cursor = 'url(cursor_closedhand.cur), move';	
			
			thisObject.Mouse.startX = thisObject.Helper.mouseX(e);
			thisObject.Mouse.startY = thisObject.Helper.mouseY(e);
			thisObject.Mouse.busy = true;
			thisObject.Helper.suppressBrowserDefault(e);			
		},

		stop: function()
		{
			// Set openhand cursor
			thisObject.imagesDiv.style.cursor = 'url(cursor_openhand.cur), move';
			
			if(thisObject.inverseX)
			{
				thisObject.Mouse.stopX = -(thisObject.Mouse.x -thisObject.Object.width);
			}
			else
			{
				thisObject.Mouse.stopX = thisObject.Mouse.x;
			}
			if(thisObject.inverseY)
			{
				thisObject.Mouse.stopY = -(thisObject.Mouse.y -thisObject.Object.height);
			}
			else
			{
				thisObject.Mouse.stopY = thisObject.Mouse.y;
			}
			thisObject.Mouse.busy = false;
		}
	};

	/* Helper functions */
	this.Helper =
	{
		/* Add events */
		addEvent: function(obj, type, fn)
		{
			if(obj.addEventListener)
			{
				obj.addEventListener(type, fn, false);
			}
			else if(obj.attachEvent)
			{
				obj["e"+type+fn] = fn;
				obj[type+fn] = function() { obj["e"+type+fn]( window.event ); };
				obj.attachEvent( "on"+type, obj[type+fn] );
			}
		},

		/* Format integers to 3 char wide strings with leading zeros */
		leadingZero: function(number)
		{
			var max = 3 - number.toString().length;
			var result = '';
			for(var i=1; i <= max; i++)
			{	
				result += '0';
			}
			result += number; 
			return result;
		},

		/* Mouse x coordinates */
		mouseX: function(e)
		{
			var x = 0;
			if(e.touches)
			{
				x = e.touches[0].pageX;
			}
			else
			{
				if(e.pageX) { x = e.pageX; }
				else if(e.clientX) { x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; }
			}		
			return x;
		},

		/* Mouse y coordinates */
		mouseY: function(e)
		{
			var y = 0;
			if(e.touches)
			{
				y = e.touches[0].pageY;
			}
			else
			{
				if(e.pageY) { y = e.pageY; }
				else if(e.clientY) { y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; }
			}
			return y;
		},
		
		/* Suppress default browser behaviour to avoid image/text selection while dragging */
		suppressBrowserDefault: function(e)
		{
			if(e.preventDefault)
			{
				e.preventDefault();
			}
			else
			{
				e.returnValue = false;
			}
			return false;
		}
	};
}

/* DOMContentLoaded event handler - by Tanny O'Haley [1] */
var JavaScriptObjectDomReadyEvent =
{
	name: "JavaScriptObjectDomReadyEvent",
	/* Array of DOMContentLoaded event handlers.*/
	events: {},
	domReadyID: 1,
	bDone: false,
	DOMContentLoadedCustom: null,

	/* Function that adds DOMContentLoaded listeners to the array.*/
	add: function(handler)
	{
		/* Assign each event handler a unique ID. If the handler has an ID, it has already been added to the events object or been run.*/
		if (!handler.$$domReadyID)
		{
			handler.$$domReadyID = this.domReadyID++;

			/* If the DOMContentLoaded event has happened, run the function. */
			if(this.bDone)
			{
				handler();
			}

			/* store the event handler in the hash table */
			this.events[handler.$$domReadyID] = handler;
		}
	},

	remove: function(handler)
	{
		/* Delete the event handler from the hash table */
		if (handler.$$domReadyID)
		{
			delete this.events[handler.$$domReadyID];
		}
	},

	/* Function to process the DOMContentLoaded events array. */
	run: function()
	{
		/* quit if this function has already been called */
		if (this.bDone)
		{
			return;
		}

		/* Flag this function so we don't do the same thing twice */
		this.bDone = true;
		
		// iterates through array of registered functions 
		for (var i in this.events) {
			this.events[i]();
		}
	},

	schedule: function()
	{
		/* Quit if the init function has already been called*/
		if (this.bDone)
		{
			return;
		}

		/* First, check for Safari or KHTML.*/
		if(/KHTML|WebKit/i.test(navigator.userAgent))
		{
			if(/loaded|complete/.test(document.readyState))
			{
				this.run();
			}
			else
			{
				/* Not ready yet, wait a little more.*/
				setTimeout(this.name + ".schedule()", 100);
			}
		}
		else if(document.getElementById("__ie_onload"))
		{
			/* Second, check for IE.*/
			return true;
		}

		/* Check for custom developer provided function.*/
		if(typeof this.DOMContentLoadedCustom === "function")
		{
			/* if DOM methods are supported, and the body element exists (using a double-check
			including document.body, for the benefit of older moz builds [eg ns7.1] in which
			getElementsByTagName('body')[0] is undefined, unless this script is in the body section) */
			if(typeof document.getElementsByTagName !== 'undefined' && (document.getElementsByTagName('body')[0] !== null || document.body !== null))
			{
				/* Call custom function. */
				if(this.DOMContentLoadedCustom())
				{
					this.run();
				}
				else
				{
					/* Not ready yet, wait a little more. */
					setTimeout(this.name + ".schedule()", 250);
				}
			}
		}
		return true;
	},

	init: function()
	{
		/* If addEventListener supports the DOMContentLoaded event.*/
		if(document.addEventListener)
		{
			document.addEventListener("DOMContentLoaded", function() { JavaScriptObjectDomReadyEvent.run(); }, false);
		}

		/* Schedule to run the init function.*/
		setTimeout("JavaScriptObjectDomReadyEvent.schedule()", 100);

		function run()
		{
			JavaScriptObjectDomReadyEvent.run();
		}

		/* Just in case window.onload happens first, add it to onload using an available method.*/
		if(typeof addEvent !== "undefined")
		{
			addEvent(window, "load", run);
		}
		else if(document.addEventListener)
		{
			document.addEventListener("load", run, false);
		}
		else if(typeof window.onload === "function")
		{
			var oldonload = window.onload;
			window.onload = function()
			{
				JavaScriptObjectDomReadyEvent.run();
				oldonload();
			};
		}
		else
		{
			window.onload = run;
		}

		/* for Internet Explorer */
		/*@cc_on
			@if (@_win32 || @_win64)
			document.write("<script id=__ie_onload defer src=\"//:\"><\/script>");
			var script = document.getElementById("__ie_onload");
			script.onreadystatechange = function()
			{
				if (this.readyState == "complete")
				{
					JavaScriptObjectDomReadyEvent.run(); // call the onload handler
				}
			};
			@end
		@*/
	}
};

var JavaScriptObjectDomReady = function(handler) { JavaScriptObjectDomReadyEvent.add(handler); };
JavaScriptObjectDomReadyEvent.init();

/* Instantiates JavaScriptObjects */
var JavaScriptObjectFactory = {
	
	/* Get DOM elements by class name - function by Dustin Diaz [2] */
    getElementsByClass: function (searchClass, tag, node) 
	{
		var classElements = [];
		var els = node.getElementsByTagName(tag);
		var elsLen = els.length;
		var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
		for(var i = 0, j = 0; i < elsLen; i++)
		{
			if(pattern.test(els[i].className))
			{
				classElements[j] = els[i];
				j++;
			}
		}
		return classElements;
    },
	
	/* Instantiate JavaScriptObjects for each IMG element with the class name 'javascriptobject' */
	run: function()
	{
		var objectElements = JavaScriptObjectFactory.getElementsByClass('javascriptobject','IMG',document);
		var max = objectElements.length;
		var instanceName = '';
		for(var j=0; j<max; j++)
		{
			instanceName = objectElements[j].getAttribute('id');
			this[instanceName] =  new JavaScriptObject();
			this[instanceName].init(instanceName);
		}
	}
};

/* Create JavaScriptObject instances when the DOM structure has been loaded */
JavaScriptObjectDomReady(function()
{
	JavaScriptObjectFactory.run();
});