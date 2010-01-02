/*
Name:       JavaScriptObject
Version:    0.9.2 (Januar 02 2010)
Author:     Finn Rudolph
Support:    http://finnrudolph.de/JavaScriptObject

License:    This Code is licensed under a Creative Commons 
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

Credits:    This script uses the domReady function from Tanny O'Haley [1] and the 
            getElementsByClass function by Dustin Diaz [2].

            [1] http://tanny.ica.com/ICA/TKO/tkoblog.nsf/dx/domcontentloaded-for-browsers-part-v
            [2] http://www.dustindiaz.com/getelementsbyclass
*/

/* JavaScriptObject constructor */
function JavaScriptObject ()
{
	/* Closure for this */
	var my = this;

	/* Initiate JavaScriptObject */
	this.init = function(objectID)
	{
		this.objectID = objectID;

		/* Try to get JavaScriptObject image element */
		var objectImage = document.getElementById(my.objectID);
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

			/* Evaluate bool settings from longdesc attribute */
			var objectSettings = objectImage.getAttribute('longdesc');
			var settingsArray = ['inverseX', 'inverseY', 'lazy', 'lock'];

			/* Register all setting names as global variables and set them true/false */
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
			if(my.lazy)
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
			var parent = my.Object.element.parentNode;

			/* Create images div container */
			var imagesDiv = document.createElement('div');
			imagesDiv.setAttribute('id',my.objectID);
			imagesDiv.setAttribute('class','javascriptobject');
			imagesDiv.setAttribute('className','javascriptobject');
			imagesDiv.style.width = my.Object.width + 'px';
			imagesDiv.style.height = my.Object.height + 'px';

			/* Replace initial image node by images div container */
			parent.insertBefore(imagesDiv, my.Object.element);
			parent.removeChild(my.Object.element);

			/* Create a two dimensional array to handle the frames */
			var frameArray = [my.Object.resY];
			for (var i=0; i < my.Object.resY; i++)
			{
				frameArray[i] = [my.Object.resX];
			}

			/* Create all image elements within the imagesDiv */
			var image = null;
			var row_str = '';
			for(var row = 0; row < my.Object.resY; row++)
			{
				row_str = my.Helper.leadingZero(row);
				for(var col = 0; col < my.Object.resX; col++)
				{
					image = document.createElement('img');
					image.setAttribute('src',my.Object.path+row_str+'_'+my.Helper.leadingZero(col)+'.'+my.Object.type);
					image.setAttribute('width',my.Object.width);
					image.setAttribute('height',my.Object.height);
					image.style.display = 'none';
					imagesDiv.appendChild(image);
					frameArray[row][col] = image;
				}
			}

			/* Create loading text container */
			var loadingP = document.createElement('p');
			var loadingText = document.createTextNode(' ');
			loadingP.setAttribute('id',my.objectID+'_loading_txt');
			loadingP.appendChild(loadingText);

			/* Create loading div container */
			var loadingDiv = document.createElement('div');
			loadingDiv.setAttribute('id',my.objectID+'_loading');
			loadingDiv.setAttribute('class','loading');
			loadingDiv.setAttribute('className','loading');

			/* Create loading bar div container inside the loading div */
			var loadingBarDiv = document.createElement('div');
			loadingBarDiv.setAttribute('id',my.objectID+'_loading_bar');
			loadingBarDiv.setAttribute('class','loading_bar');
			loadingBarDiv.setAttribute('className','loading_bar');
			loadingDiv.appendChild(loadingBarDiv);

			/* Append */
			imagesDiv.appendChild(loadingP);
			imagesDiv.appendChild(loadingDiv);

			/* Set globals */
			my.imagesDiv = document.getElementById(my.objectID);
			my.loadingDiv = document.getElementById(my.objectID+'_loading');
			my.loadingBar = document.getElementById(my.objectID+'_loading_bar');
			my.loadingP = document.getElementById(my.objectID+'_loading_txt');

			/* Position the loading bar */
			my.loadingP.style.paddingTop = ((my.imagesDiv.offsetHeight * 0.5) -30) + 'px';

			/* Proceed if structure creation was successful */
			my.frameArray = frameArray;
			if(my.frameArray.length > 0)
			{
				/* Initiate loading progress */
				my.Loading.init();
			}
		},

		lazy: function()
		{
			/* Get parent node of the initial image element */
			var parent = my.Object.element.parentNode;

			/* Create lazy div container */
			var lazyDiv = document.createElement('div');
			lazyDiv.setAttribute('id',my.objectID+'_lazy');
			lazyDiv.setAttribute('class','javascriptobject');
			lazyDiv.setAttribute('className','javascriptobject');
			lazyDiv.style.position = 'absolute';
			lazyDiv.style.width = my.Object.width + 'px';
			lazyDiv.style.height = my.Object.height + 'px';
			lazyDiv.style.textAlign = 'center';
			lazyDiv.style.zIndex = 1;

			/* Create 'load object' link */
			var lazyLink = document.createElement('a');
			var lazyText = document.createTextNode('Load Object');
			lazyLink.appendChild(lazyText);
			lazyLink.setAttribute('href','');
			lazyLink.style.height = my.Object.height/2 + 'px';	
			lazyLink.style.paddingTop = my.Object.height/2 + 'px';	
			lazyLink.appendChild(lazyText);

			/* Set link behaviour */
			lazyLink.onclick = function()
			{
				parent.removeChild(lazyDiv);
				my.Structure.create();
				return false;
			};

			/* Write to DOM */
			lazyDiv.appendChild(lazyLink);
			parent.insertBefore(lazyDiv, my.Object.element);
		}
	};

	/* Manage loading progress and initialize core components after loading */
	this.Loading =
	{
		init: function()
		{
			var p = my.Loading.getStatus();

			if(p < 100 || my.loadingFirstCheck === true)
			{
				/* Insert a short delay if the browser loads rapidly from its cache */
				if(my.loadingFirstCheck === true && p == 100)
				{
					my.loadingFirstCheck = false;
					window.setTimeout(my.Loading.init, 100);
				}
				else
				{
					window.setTimeout(my.Loading.init, 40);
				}
			}
			else
			{				
				/* Hide loading elements */
				my.loadingP.style.display = 'none';
				my.loadingDiv.style.display = 'none';

				/* Display start image */
				my.frameArray[my.Object.startRow][my.Object.startCol].style.display = 'block';
	
				/* Initialize core components */
				my.Mouse.init();
				my.Renderer.init();

				/* Set Renderer to startRow and startCol */
				my.Renderer.row = my.Object.startRow;
				my.Renderer.col = my.Object.startCol;

				/* Calculate corresponding mouse coordinates for startRow and startCol */
				var stepX = my.Object.width / (my.Object.resX-1);
				var stopX = Math.round( stepX * my.Object.startCol );
				
				var stepY = my.Object.height / (my.Object.resY-1);
				var stopY = Math.round( stepY * my.Object.startRow );

				if(my.Object.resY < 1)
				{
					stopY = 0;
				}
				

				/* Set mouse coordinates */
				my.Mouse.x = stopX;
				my.Mouse.y = stopY;

				/* Inverse */
				if(my.inverseX){ stopX = -(stopX - my.Object.width); }
				if(my.inverseY){ stopY = -(stopY - my.Object.height); }

				my.Mouse.stopX = stopX;
				my.Mouse.stopY = stopY;	
			}
		},

		getStatus: function()
		{
			var max = my.imagesDiv.childNodes.length;
			var i = 0, completed = 0;
			var image = null;
			for(var index = 0; index < max; index++)
			{
				image = my.imagesDiv.childNodes[index];
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
			my.loadingBar.style.width = finished+'%';
			var loadingTxt = document.createTextNode('loading frames '+completed+'/'+i);
			my.loadingP.replaceChild(loadingTxt,my.loadingP.firstChild);

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
			my.Helper.addEvent(my.imagesDiv,'mousedown',my.Renderer.start);
			my.Helper.addEvent(document,'mouseup',my.Renderer.stop);
			
			/* iPod Touch and iPhone events */
			my.Helper.addEvent(my.imagesDiv,'touchstart',my.Renderer.start);
			my.Helper.addEvent(document,'touchend',my.Renderer.stop);
		},

		start: function()
		{
			my.Renderer.interval = window.setInterval(my.Renderer.loop, 10);
		},

		stop: function()
		{	
			window.clearInterval(my.Renderer.interval);
		},

		loop: function()
		{
			/* Rotate object */
			my.Renderer.rotate(my.Mouse.x,my.Mouse.y);
		},
		
		rotate: function(x,y)
		{
			x = Math.round(x / (my.Object.width / (my.Object.resX-1)));
			y = Math.round(y / (my.Object.height / (my.Object.resY-1)));
			
			/* Hide previous frame and display current */
			my.frameArray[my.Renderer.row][my.Renderer.col].style.display = 'none';
			my.frameArray[y][x].style.display = 'block';
			
			/* Set row and col to current */
			my.Renderer.col = x;
			my.Renderer.row = y;
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
			my.Helper.addEvent(my.imagesDiv,'mousedown',my.Mouse.start);
			my.Helper.addEvent(document,'mousemove',my.Mouse.getPosition);
			my.Helper.addEvent(document,'mouseup',my.Mouse.stop);
			
			/* iPod Touch and iPhone events */
			my.Helper.addEvent(my.imagesDiv,'touchstart',my.Mouse.start);
			my.Helper.addEvent(document,'touchmove',my.Mouse.getPosition);
			my.Helper.addEvent(document,'touchend',my.Mouse.stop);
			
			/* Avoid text and image selection while dragging */
			my.Helper.addEvent(my.imagesDiv,'selectstart',my.Helper.suppressBrowserDefault);
			my.Helper.addEvent(my.imagesDiv,'click',my.Helper.suppressBrowserDefault);
		},

		/* Get mouse position within image - left top corner is [0,0] */
		getPosition: function(e)
		{
			if(my.Mouse.busy === true)
			{
				var newX = -(my.Helper.mouseX(e) - my.Mouse.startX - my.Mouse.stopX);
				var newY = -(my.Helper.mouseY(e) - my.Mouse.startY - my.Mouse.stopY);

				/* Inverse the rotation direction */
				if(my.inverseX){ newX = -(newX - my.Object.width); }
				if(my.inverseY){ newY = -(newY - my.Object.height); }
				
				/* Rotation is endless if the object is not locked */
				var isEndless = (my.lock) ? false : true;
				
				/* Map x-axis mouse coordinates in range of the object width */
				if(newX < 0)
				{
					if(isEndless)
					{
						if(my.inverseX)
						{
							my.Mouse.startX -= my.Object.width;
						}
						else
						{
							my.Mouse.startX += my.Object.width;
						}
					}
					newX = 0;
				}
				if(newX > my.Object.width)
				{
					if(isEndless)
					{
						if(my.inverseX)
						{
							my.Mouse.startX += my.Object.width;
						}
						else
						{
							my.Mouse.startX -= my.Object.width;
						}
					}
					newX = my.Object.width;
				}  

				/* Map y-axis mouse coordinates in range of the object height */
				if(newY < 0)
				{
					if(isEndless)
					{
						if(my.inverseY)
						{
							my.Mouse.startY -= my.Object.height;
						}
						else
						{
							my.Mouse.startY += my.Object.height;
						}
					}
					newY = 0;
				}
				if(newY > my.Object.height)
				{
					if(isEndless)
					{
						if(my.inverseY)
						{
							my.Mouse.startY += my.Object.height;
						}
						else
						{
							my.Mouse.startY -= my.Object.height;
						}
					}
					newY = my.Object.height;
				}
				my.Mouse.x = newX;
				my.Mouse.y = newY;
				my.Helper.suppressBrowserDefault(e);
			}
		},

		start: function(e)
		{
			/* Set closedhand cursor */
			my.imagesDiv.style.cursor = 'url(cursor_closedhand.cur), move';	
			
			my.Mouse.startX = my.Helper.mouseX(e);
			my.Mouse.startY = my.Helper.mouseY(e);
			my.Mouse.busy = true;
			my.Helper.suppressBrowserDefault(e);			
		},

		stop: function()
		{
			/* Set openhand cursor */
			my.imagesDiv.style.cursor = 'url(cursor_openhand.cur), move';
			
			if(my.inverseX)
			{
				my.Mouse.stopX = -(my.Mouse.x -my.Object.width);
			}
			else
			{
				my.Mouse.stopX = my.Mouse.x;
			}
			if(my.inverseY)
			{
				my.Mouse.stopY = -(my.Mouse.y -my.Object.height);
			}
			else
			{
				my.Mouse.stopY = my.Mouse.y;
			}
			my.Mouse.busy = false;
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