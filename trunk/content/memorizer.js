/**********************************************
	
	Memorizer!
	
	This implementation Copyright
	Chris McCormick, 2007, 2008
	chris@podsix.com.au
	All rights reserved.
	
**********************************************/ 

// configuration
if (document.location.href.indexOf("dev.podsix.com.au") != -1)
{
	imgs = "http://dev.podsix.com.au/games/Memorizer/Memorizer/images/";
}
else if (document.location.href.indexOf("podsix.com.au") != -1)
{
	imgs = "http://podsix.com.au/games/Memorizer/Memorizer/images/";
}
else
{
        imgs = "images/";
}

// stop heaps of images reloading every time, jerks
try {
	document.execCommand("BackgroundImageCache", false, true);
} catch(err) {}

GetImageUrl = _IG_GetImageUrl;

body = document.body;

// get cached images
i_card = [];
for (i = 1; i < 13; i++)
{
	i_card.push(GetImageUrl(imgs + "card" + i + ".png"));
}

i_title = GetImageUrl(imgs + "title.png");
i_memorizer = GetImageUrl(imgs + "memorizer.png");

i_moregames = GetImageUrl(imgs + "getmoregames.png");
i_moregamesH = GetImageUrl(imgs + "getmoregamesH.png");
i_startnew = GetImageUrl(imgs + "startanewgame.png");
i_startnewH = GetImageUrl(imgs + "startanewgameH.png");

i_background = GetImageUrl(imgs + "podsixbg.png");

i_youwin = GetImageUrl(imgs + "youwin.png");
i_playagain = GetImageUrl(imgs + "playagain.png");
i_playagainH = GetImageUrl(imgs + "playagainH.png");

// list of images to pre-load
var preloadList = [i_title, i_memorizer, i_moregames, i_moregamesH, i_startnew, i_startnewH, i_background, i_youwin, i_playagain, i_playagainH];
for (i = 0; i < 12; i++)
{
	preloadList.push(i_card[i]);
}

// Function that creates a new HTML object with the given ID
function MakeDiv(boss)
{
        e = document.createElement("div");
        e.style.position = "absolute";
	boss.appendChild(e);
	return e;
}

function MakeImg(boss)
{
        e = document.createElement("img");
        e.style.position = "absolute";
        boss.appendChild(e);
        return e;
}

/*** indexOf ***/

if (!Array.prototype.indexOf)
{
	Array.prototype.indexOf = function(elt /*, from*/)
	{
		var len = this.length;

		var from = Number(arguments[1]) || 0;
		from = (from < 0)
				 ? Math.ceil(from)
				 : Math.floor(from);
		if (from < 0)
			from += len;

		for (; from < len; from++)
		{
			if (from in this &&
					this[from] === elt)
				return from;
		}
		return -1;
	};
}

/****************************************
	Winning screen class
*****************************************/

function WinScreen(where, app)
{
	var repr = MakeDiv(where);
	repr.style.width = where.style.width;
	repr.style.height = where.style.height;
	repr.style.backgroundImage = "url(" + i_background + ")";
	repr.style.backgroundRepeat = "no-repeat";
	repr.style.backgroundPosition = "center center";
	this.app = app;
	
	this.repr = repr;
	
	this.wintext = MakeDiv(repr)
	this.wintext.style.backgroundImage = "url(" + i_youwin + ")";
	this.wintext.style.width = repr.style.width;
	this.wintext.style.height = repr.style.height;
	this.wintext.style.backgroundRepeat = "no-repeat";
	this.wintext.style.backgroundPosition = "center center";
	
	this.Hide = function Hide()
	{
		repr.style.visibility = "hidden";
	}
	
	this.Show = function Show()
	{
		repr.style.visibility = "visible";
		window.setTimeout("PodSix.callback[" + PodSix.RegisterCallback(this) + "].app.ShowTitle();", 3000);
	}
	
	this.Hide();
}

/****************************************
	Image loading screen class
*****************************************/

function Loading(where, preloadList)
{
	var repr = MakeDiv(where);
	repr.style.width=where.style.width;
	repr.style.height=where.style.height;
	repr.style.backgroundColor = "#ffffff";
	repr.style.textAlign = "center";
	repr.style.fontFamily = "arial";
	repr.style.fontWeight = "bold";
	repr.style.fontSize = "20px";
	repr.innerHTML = "<br/><br/>Loading...<br />";
	
	this.repr = repr;
	this.dots = 3;
	this.h = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	
	this.preload = [];
	for (p in preloadList)
	{
		this.preload[p] = new Image();
		this.preload[p].src = preloadList[p];
	}
	
	function Hide()
	{
		repr.style.visibility = "hidden";
	}
	this.Hide = Hide;
	
	function Show()
	{
		repr.style.visibility = "visible";
	}
	this.Show = Show;
	
	function StartCheck(mainobj)
	{
		this.mainobj = mainobj;
		this.Check(PodSix.RegisterCallback(this));
	}
	this.StartCheck = StartCheck;
	
	function Check(loadingid)
	{
		var done = true;
		for (p in this.preload)
		{
			if (!this.preload[p].complete)
				done = false;
		}
		
		if (done)
		{
			this.Hide()
		}
		else
		{
			chk = window.setTimeout("PodSix.callback[" + loadingid + "].Check(" + loadingid + ");", 200);
		}
		
		this.repr.style.color = "#" + this.h[this.dots] + this.h[this.dots] + this.h[this.dots];
		this.dots += 1;
		this.dots %= 16;
	}
	this.Check = Check;
}

/********************************
        Menu/Title screen
*********************************/

function TitleScreen(where, callbackID)
{
	this.callbackID = callbackID;
	
	this.id = PodSix.RegisterCallback(this);
	
	var repr = MakeDiv(where);
	repr.style.width = where.style.width;
	repr.style.height = where.style.height;
	repr.style.backgroundColor = "#ffffff";
	repr.style.backgroundImage = "url(" + i_title + ")";
	repr.style.backgroundRepeat = "no-repeat";
	repr.style.backgroundPosition = "top center";
	repr.style.zIndex = 1000;
	this.option = [MakeDiv(repr), MakeDiv(repr)];
	
	this.title = MakeDiv(repr);
	this.title.style.backgroundImage = "url(" + i_memorizer + ")";
	this.title.style.width = repr.style.width;
	this.title.style.height = "46";
	this.title.style.top = "65px";
	this.title.style.border = "0px solid black";
	this.title.style.backgroundRepeat = "no-repeat";
	this.title.style.backgroundPosition = "center center";
	
	var imgs;
	var roll;
	imgs = [i_moregames, i_startnew];
	roll = [i_moregamesH, i_startnewH];
	var preload = [[new Image(), new Image()], [new Image(), new Image()]];
	var ispodsix = (document.referrer.indexOf("podsix.com.au") >= 0 && !(document.referrer.indexOf("facebook") >= 0)) * 1;
	
	for (j = 1; j >= ispodsix; j--)
	{
		// preload the rollovers
		preload[j][0].src = imgs[j];
		preload[j][1].src = roll[j];
		
		var i = j;
		this.i = j;
		this.option[i].style.width = repr.style.width;
		this.option[i].style.height = "60px";
		this.option[i].style.bottom = (i * 38) + "px";
		this.option[i].style.border = "0px solid black";
		this.option[i].style.backgroundRepeat = "no-repeat";
		this.option[i].style.backgroundPosition = "center center";
		this.option[i].style.backgroundImage = "url(" + imgs[i] + ")";
		this.option[i].boss = this;
		this.option[i].i = i;
		
		this.option[i].onmouseover = function (e)
		{
			if (!e) var e = window.event;
			var t = e.target ? e.target : e.srcElement;;
			t.style.backgroundImage = "url(" + roll[t.i] + ")";
		}
		
		this.option[i].onmouseout = function (e)
		{
			if (!e) var e = window.event;
			var t = e.target ? e.target : e.srcElement;;
			t.style.backgroundImage = "url(" + imgs[t.i] + ")";
		}
		
		if (i == 1)
		{
			this.option[i].onmouseup = function (e)
			{
				if (!e) var e = window.event;
				var t = e.target ? e.target : e.srcElement;;
				// start a fresh game
				PodSix.callback[t.boss.callbackID].Main();
				//PodSix.callback[t.boss.callbackID].ad.style.visibility = "hidden !important";
				PodSix.callback[t.boss.callbackID].ad.style.visibility = "hidden";
				PodSix.callback[t.boss.callbackID].ad.style.display = "none";
			}
		}
		else
		{
			this.option[i].onmouseup = function ()
			{
				newWin = window.open('http://podsix.com.au/pod/Games/');
			}
		}
	}
	
	this.Hide = function Hide()
	{
		repr.style.visibility = "hidden";
	}
	
	this.Show = function Show()
	{
		repr.style.visibility = "visible";
	}
}

/**************************
	Card Class
***************************/

function Card(game)
{
	this.Init = function(i, c)
	{
		this.game = game;
		this.id = PodSix.RegisterCallback(this);
		this.direction = 0;
		this.flipping = false;
		this.i = i;
		this.c = c;
		
		this.cardX = (c % 3) * 105 + 6;
		this.cardY = parseInt(c / 3) * 60 + 5;
		
		this.onclick = function(e)
		{
			if (!e) var e = window.event;
			var t = e.target ? e.target : e.srcElement;;
			if (t.game.numFlipped <= 1)
				t.Flip();
		}
	}
	
	this.Flip = function(id)
	{
		if (!this.flipping)
		{
			if (this.src.indexOf("cardback.png") > 0)
				this.game.numFlipped += 1;
			this.flipping = true;
			this.anim = setInterval("PodSix.callback[" + this.id + "].Flip(" + this.id + ")", 10);
		}
		else
		{
			var t = PodSix.callback[id];
			var game = t.game;
			
			if (!t.direction)
			{
				if (t.offsetWidth > game.flipSpeed)
				{
					t.style.width = t.offsetWidth - game.flipSpeed;
					t.style.height = game.cardHeight + "px";
					t.style.left = t.cardX + (game.cardWidth - t.offsetWidth) / 2;
				}
				else
				{
					t.direction = 1;
					if (t.src.indexOf("cardback.png") > 0)
						t.src = imgs + "card" + t.i + ".png";
					else
						t.src = imgs + "cardback.png";
					t.style.left = t.cardX + game.cardWidth / 2;
				}
			}
			else if (t.offsetWidth < game.cardWidth - game.flipSpeed)
			{
				t.style.width = t.offsetWidth + game.flipSpeed;
				t.style.height = game.cardHeight + "px";
				t.style.left = t.cardX + (game.cardWidth - t.offsetWidth) / 2;
			}
			else
			{
				t.style.width = game.cardWidth + "px";
				t.style.left = t.cardX;
				t.direction = 0;
				clearInterval(t.anim);
				t.anim = setTimeout("PodSix.callback[" + this.id + "].FlipDone(" + this.id + ")", 200);
			}
		}
	}
	
	this.FlipDone = function(id)
	{
		var t = PodSix.callback[id];
		var game = t.game;
		t.flipping = null;
		if (t.src.indexOf("card" + t.i + ".png") > 0)
			t.game.CheckMatch(t);
		else
			t.game.numFlipped -= 1;

	}
}

/******************************
	Memorizer Class
*******************************/

function Memorizer(where)
{
	this.lastClicked = null;
	this.numFlipped = 0;
	this.anim = null;
	this.cardWidth = 100;
	this.cardHeight = 55;
	this.gameid = PodSix.RegisterCallback(this);
	this.flipSpeed = 7;
	this.loadingScreen = null;
	this.winScreen = null;
	this.cards = [];
	

	this.Launch = function(where)
	{
		field = document.createElement("div");
		field.style.border = "0px solid black";
		field.style.width = "322px";
		field.style.height = "485px";
		field.style.margin = "0px";
		field.style.padding = "0px";
		field.style.backgroundImage = "url(" + i_background + ")";
		field.style.backgroundRepeat = "no-repeat";
		field.style.backgroundPosition = "center center";
		field.style.position = "absolute";
		this.field = field;
		
		document.getElementById(where).appendChild(field);
		
		this.winScreen = new WinScreen(field, this);
		this.titleScreen = new TitleScreen(field, PodSix.RegisterCallback(this));
		
		this.loadingScreen = new Loading(field, preloadList);
		this.loadingScreen.StartCheck(this);
		
		this.ad = document.getElementById("memorizerAd");
		this.ad.style.top = parseInt(field.offsetTop) + 150;
		this.ad.style.position = "absolute";
		this.ad.style.left = parseInt(field.offsetLeft) + parseInt(field.offsetWidth) / 2 - this.ad.offsetWidth / 2;
		this.ad.style.zIndex = 1000;
	}
	
	this.ShowTitle = function()
	{
		this.titleScreen.Show();
		this.ad.style.visibility = "visible";
		this.ad.style.display = "inline";
	}
	
	this.Main = function()
	{
		this.winScreen.Hide();
		this.titleScreen.Hide();
		this.MakeCards(this.field);
	}
	
	this.MakeCards = function(field)
	{
		card = {};
		pos = {};
		
		// pick 10 cards at random and add them twice
		for (i = 0; i < 12; i++)
		{
			do { c = parseInt(Math.random() * 12) } while (card[c]);
			card[c] = true;
			do { p = parseInt(Math.random() * 24) } while (pos[p]);
			pos[p] = c + 1;
			do { p = parseInt(Math.random() * 24) } while (pos[p]);
			pos[p] = c + 1;
		}
		
		this.MakeCard = function(f, i, c)
		{
			n = MakeImg(f);
			//document.createElement("img");
			this.cards[this.cards.length] = n;
			PodSix.Inherit(n, new Card(this));
			n.Init(i, c);
			n.src = imgs + "cardback.png";
			n.style.left = n.cardX;
			n.style.top = n.cardY;
		}
		
		// pick out double positions for each card
		for (i in pos)
		{
			this.MakeCard(field, pos[i], i);
		}
	}
	
	this.CheckMatch = function(t)
	{
		if (this.lastClicked)
		{
			if (this.lastClicked.i == t.i && this.lastClicked.c != t.c)
			{
				// make cards disappear
				this.field.removeChild(t);
				this.cards.splice(this.cards.indexOf(t), 1);
				delete(t);
				this.field.removeChild(t.game.lastClicked);
				this.cards.splice(this.cards.indexOf(t.game.lastClicked), 1);
				delete(t.game.lastClicked);
				
				t.game.numFlipped = 0;
				if (!this.cards.length)
					this.winScreen.Show();
			}
			else
			{
				// flip both cards back
				t.Flip();
				this.lastClicked.Flip();
			}
			this.lastClicked = null;
		}
		else
		{
			this.lastClicked = t;
		}
	}
	
	this.Launch(where);
}
