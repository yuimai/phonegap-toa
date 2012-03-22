var now = new Date(); 
var currentUTCHours = now.getUTCHours(); // 0-23
var currentUTCMinutes = now.getUTCMinutes(); // 0-59

var hitUsers = [];
var tweets = [];
var users = {};

var localTimeEachAngle = [];
var tweetsEachAngle = [];
var angles = [];

var CENTERX = 500;
var CENTERY = 400;
var rad = Math.PI / 180;

/*
String.prototype.width = function(font) {
  var f = font || '10px arial',
      o = $('<div>' + this + '</div>')
            .css({'position': 'absolute', 'float': 'left', 'visibility': 'hidden', 'font': f})
            .appendTo($('body')),
      w = o.width();

  o.remove();

  return w;
}
*/

// Handy JavaScript to meature the size taken to render the supplied text;
// you can supply additional style information too if you have it to hand.
var lDiv;
function measureText(pText, pFontSize, pStyle) {
    if(!lDiv)
    {
      lDiv = document.createElement('lDiv');
      document.body.appendChild(lDiv);
    }

    if (pStyle != null) {
        lDiv.style = pStyle;
    }
    lDiv.style.fontSize = "" + pFontSize + "px";
    lDiv.style.position = "absolute";
    lDiv.style.wordBreak = "break-all";
    lDiv.style.left = -1000;
    lDiv.style.top = -1000;

    lDiv.innerText = pText;

    var lResult = {
        width: lDiv.clientWidth,
        height: lDiv.clientHeight
    };

//    document.body.removeChild(lDiv);
//    lDiv = null;

    return lResult;
}

function parseUser(u){
	for(var i=0;i<u.length;i++)
	{
		u[i].screen_name = String(u[i].screen_name).toLowerCase();
		users[u[i].screen_name] = u[i];
	}

	parseStockData();
	makeRegion();
}

function parseTweet(t){
	for(var i=0;i<t.results.length;i++)
	{
		var tweet = t.results[i];
		
		// When we get users json, sometimes username changes to lowercase for maybe their issue so force convert to lowercase for matching.
		tweet.from_user = String(tweet.from_user).toLowerCase();
		
		console.log("=================================");
		console.log(tweet.created_at);
		console.log(tweet.from_user);
		console.log(tweet.text);
		
		hitUsers.push( tweet.from_user );
		tweets.push( tweet );
	}

	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type= 'text/javascript';
	script.src= 'http://api.twitter.com/1/users/lookup.json?screen_name=' + hitUsers.join(',') + '&callback=parseUser';
	head.appendChild(script);
}

function getTimeZone(lang)
{
	return "unknown";
}

function getUTCOffset(time_zone)
{
	return 0;
}

function getLocalNow(offset)
{
	var diff_time = (now.getTimezoneOffset() * 60) + offset;
	var local_time = now.getTime() + (diff_time * 1000);
	return new Date( local_time );
}

function parseStockData(){
	for(var i=0;i<tweets.length;i++)
	{
		//console.log("user="+tweets[i].from_user);
		
		if(!users[tweets[i].from_user].time_zone)
			continue;
		//if(!users[tweets[i].from_user].time_zone)
		//	users[tweets[i].from_user].time_zone = getTimeZone(tweets[i].iso_language_code);
		//if(!users[tweets[i].from_user].utc_offset)
		//	users[tweets[i].from_user].utc_offset = getUTCOffset(users[tweets[i].from_user].time_zone);

		var localtime = getLocalNow(users[tweets[i].from_user].utc_offset);
		var angle = localtime.getHours() / 24 * 360 + localtime.getMinutes() / 60 * 15;
		if(!tweetsEachAngle[angle])
		{
			//console.log("angle:"+angle);
			var endX = 2000 * Math.cos((90+angle%360)*rad);
			var endY = 2000 * Math.sin((90+angle%360)*rad);
	
			var svg = document.getElementsByTagName("svg");	
			var shape = document.createElementNS("http://www.w3.org/2000/svg","line");
	
			shape.setAttribute("x1", CENTERX);
			shape.setAttribute("y1", CENTERY);
			shape.setAttribute("x2", CENTERX + endX);
			shape.setAttribute("y2", CENTERY + endY);
			shape.setAttribute("style", "stroke:rgb(100,0,0);stroke-width:1");
			shape.setAttribute("stroke-dasharray", "5 5");

			svg.item(0).appendChild(shape);
		
			//console.log("endX="+endX);
			//console.log("endY="+endY);
			//console.log("now.getTimezoneOffset()="+ now.getTimezoneOffset() * 60);
			//console.log("utc_offset="+ users[tweets[i].from_user].utc_offset );
			//console.log("now.getTimezoneOffset()*60 + utc_offset=" + diff_time);
		
			tweetsEachAngle[angle] = [];
			localTimeEachAngle[angle] = localtime;
			angles.push(angle);
		}
	
		tweetsEachAngle[angle].push(tweets[i]);
	}
	
	var compare = function(a,b){
		return a-b;
	}
	
	angles.sort(compare);
}

function makeRegion()
{
	var svg = document.getElementsByTagName("svg");	
	var calAngle = function(cal)
	{
		if(cal < 0)
			return 360 + cal;
		
		if(cal > 360)
			return cal - 360;

		return cal;
	}

	for(var i=0;i<angles.length;i++)
	{
		var onlyOne = angles.length > 1;
		var isFirst = i == 0;
		var isLast = i+1 == angles.length;
		var a = angles[i];
		var nextAngle = (onlyOne) ? ((isLast) ? angles[0] : angles[i+1]) : null;
		var nextDiff = (onlyOne) ? ((isLast) ? (360 - a + angles[0]) : (angles[i+1] - a) ) : null;
		var previousAngle = (onlyOne) ? ((isFirst) ? angles[angles.length-1] : angles[i-1]) : null;
		var previousDiff = (onlyOne) ? ((isFirst) ? (360 - angles[angles.length-1] + a) : (a - angles[i-1]) ) : null;
		var minSize = getMin(nextDiff, previousDiff);
		var maxSize = getMax(nextDiff, previousDiff);
		console.log("i="+i+" angle="+a+" previous="+previousDiff+" next="+nextDiff);
		//var regionPath = sector(CENTERX, CENTERY, 2000, (a + nextDiff / 2), (a - previousDiff / 2), {});
		var regionPath = sector(CENTERX, CENTERY, 2000, (a + minSize / 2), (a - minSize / 2), {});


		var startX = 0;
		var startY = 0;
		//var xOffset = 2;
		//var yOffset = 12;
		var offset = 0;
		var makeLabel = function(str)
		{
			var r = 200 + offset;
			startX = r * Math.cos((90 + (a + minSize/2) % 360)*rad);
			startY = r * Math.sin((90 + (a + minSize/2) % 360)*rad);
			var label = document.createElementNS("http://www.w3.org/2000/svg","text");
			//label.setAttribute("x", CENTERX + startX + xOffset);
			//label.setAttribute("y", CENTERY + startY + yOffset);
			label.setAttribute("x", CENTERX + startX);
			label.setAttribute("y", CENTERY + startY);
			label.setAttribute("font-size", 11);
			label.setAttribute("fill", "yellow");
			label.setAttribute("transform", "rotate("+a+" "+(CENTERX+startX)+", "+(CENTERY+startY)+")");
			label.textContent = str;
			//yOffset += 12;
			offset += 15;
			return label;
		};
		
		var makeTweet = function(t)
		{
			var r = 200 + offset;
			//startX = r * Math.cos((90 + (a + minSize/2) % 360)*rad);
			//startY = r * Math.sin((90 + (a + minSize/2) % 360)*rad);
			var tweet = document.createElementNS("http://www.w3.org/2000/svg","g");
			//tweet.setAttribute("x", CENTERX + startX + xOffset);
			//tweet.setAttribute("y", CENTERY + startY + yOffset);
			//tweet.setAttribute("x", CENTERX + startX);
			//tweet.setAttribute("y", CENTERY + startY);
			tweet.setAttribute("font-size", 10);
			tweet.setAttribute("fill", "white");
			//tweet.setAttribute("transform", "rotate("+a+" "+(CENTERX+startX)+", "+(CENTERY+startY)+")");
			var textContent = users[t.from_user].screen_name + ":" + t.text;
			var textWidth = measureText(textContent, 10).width;
			var charWidth = textWidth / textContent.length;
			var textOffset = 0;
			while(textOffset < textContent.length)
			{
				var regionWidth = (2 * Math.PI * r) * (minSize / 360) * 0.77;
				var startX = r * Math.cos((90 + (a + minSize/2) % 360)*rad);
				var startY = r * Math.sin((90 + (a + minSize/2) % 360)*rad);
				var text = document.createElementNS("http://www.w3.org/2000/svg","text");
				var charCnt = Math.floor(regionWidth / charWidth);
				text.setAttribute("x", CENTERX + startX);
				text.setAttribute("y", CENTERY + startY);
				text.setAttribute("transform", "rotate("+a+" "+(CENTERX+startX)+", "+(CENTERY+startY)+")");
				text.textContent = textContent.substring(textOffset, (textOffset+charCnt));
				tweet.appendChild(text);
				textOffset += charCnt;
				offset += 15;
				r += 15;
			}
			//yOffset += 12;
			return tweet;
		};


		for( var j=0;j<tweetsEachAngle[angles[i]].length;j++)
		{
			var t = tweetsEachAngle[angles[i]][j];
			if(j==0)
			{
				var localtime = localTimeEachAngle[a];
				svg.item(0).appendChild(makeLabel(localtime.getHours() + ":" + localtime.getMinutes()));
				svg.item(0).appendChild(makeLabel(users[t.from_user].time_zone));
			}
			var tweet = makeTweet(t)
			svg.item(0).appendChild(tweet);
		}
		
		svg.item(0).appendChild(regionPath);
	}
}

function getMin(a, b)
{
	if(a > b)
		return b;
	else
		return a;
}

function getMax(a, b)
{
	if(b > a)
		return b;
	else
		return a;
}


function sector(cx, cy, r, startAngle, endAngle, params)
{
	startAngle = 90 + startAngle;
	endAngle = 90 + endAngle;
	console.log("cx="+cx+", cy="+cy+", startAngle="+startAngle+", endAngle="+endAngle);

	var x1 = cx + r * Math.cos(startAngle * rad);
	var y1 = cy + r * Math.sin(startAngle * rad);

	var x2 = cx + r * Math.cos(endAngle * rad);
	var y2 = cy + r * Math.sin(endAngle * rad);

	var dstr = ["M"+cx, cy, "L"+x1, y1, "A"+r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2+"Z"].join(",");
	var path = document.createElementNS("http://www.w3.org/2000/svg","path");
	path.setAttribute("fill", "url(#490--ccff00--d8ff3f)");
	path.setAttribute("stroke", "rgb(255,0,0)");
	path.setAttribute("opacity", "1");
	path.setAttribute("fill-opacity", "0");
	path.setAttribute("stroke-width", "1");
	path.setAttribute("d", dstr);
	return path;
}

