const isTouchDevice = 'ontouchstart' in document.documentElement;
const url = 'https://cors-anywhere.herokuapp.com/https://www.pornhub.com/random';
const titleH1 = document.querySelector('.title');

titleH1.innerText = `${isTouchDevice ? 'Tap' : 'Click'} anywhere!`;

async function generateTitle() {
    try {
        const res = await fetch(url);
        const data = await res.text();
        const title = data.match(/<title>(.*?)<\/title>/i)[1].split('- Pornhub.com')[0];
        return title;
    } catch (err) {
        return `Sorry, but something terrible happened and there was an error! (${err})`;
    }
}

const canv = document.querySelector('canvas');
const ctx = canv.getContext('2d');
let canvHeight;
let canvWidth;
let bgColor = '#FF6138';
const animations = [];

const colorPicker = (() => {
	const colors = ['#FF6138', '#FFBE53', '#2980B9', '#282741'];
	let i = 0;
	function next() {
		i = i++ < colors.length - 1 ? i : 0;
		return colors[i];
	}
	function current() {
		return colors[i];
	}
	return { next, current };
})();

function removeAnimation(animation) {
	const i = animations.indexOf(animation);
	if (i > -1) animations.splice(i, 1);
}

function calcPageFillRadius(x, y) {
	const l = Math.max(x - 0, canvWidth - x);
	const h = Math.max(y - 0, canvHeight - y);
	return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
}

function addClickListeners() {
    document.addEventListener('touchstart', handleEvent);
    document.addEventListener('mousedown', handleEvent);
}

function handleEvent(e) {
    if (e.touches) {
        e.preventDefault();
		e = e.touches[0];
    }
    
    generateTitle().then(res => titleH1.innerHTML = res);
    
	const currentColor = colorPicker.current();
	const nextColor = colorPicker.next();
	const targetR = calcPageFillRadius(e.pageX, e.pageY);
	const rippleSize = Math.min(200, canvWidth * 0.4);
	const minCoverDuration = 750;

	const pageFill = new Circle({
		x: e.pageX,
		y: e.pageY,
		r: 0,
		fill: nextColor
    });
    
	const fillAnimation = anime({
		targets: pageFill,
		r: targetR,
		duration: Math.max(targetR / 2, minCoverDuration),
		easing: 'easeOutQuart',
		complete: () => {
			bgColor = pageFill.fill;
			removeAnimation(fillAnimation);
		}
	});

	const ripple = new Circle({
		x: e.pageX,
		y: e.pageY,
		r: 0,
		fill: currentColor,
		stroke: {
			width: 3,
			color: currentColor
		},
		opacity: 1
    });
    
	const rippleAnimation = anime({
		targets: ripple,
		r: rippleSize,
		opacity: 0,
		easing: 'easeOutExpo',
		duration: 900,
		complete: removeAnimation
	});

	const particles = [];
	for (let i = 0; i < 32; ++i) {
		const particle = new Circle({
			x: e.pageX,
			y: e.pageY,
			fill: currentColor,
			r: anime.random(24, 48)
		});
		particles.push(particle);
    }
    
	const particlesAnimation = anime({
		targets: particles,
		x: particle => particle.x + anime.random(rippleSize, -rippleSize),
		y: particle => particle.y + anime.random(rippleSize * 1.15, -rippleSize * 1.15),
		r: 0,
		easing: 'easeOutExpo',
		duration: anime.random(1000, 1300),
		complete: removeAnimation
	});
	animations.push(fillAnimation, rippleAnimation, particlesAnimation);
}

function extend(a, b) {
	for (const key in b) if (b.hasOwnProperty(key)) a[key] = b[key];
	return a;
}

class Circle {
	constructor(opts) {
		extend(this, opts);
	}
	draw() {
		ctx.globalAlpha = this.opacity || 1;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
		if (this.stroke) {
			ctx.strokeStyle = this.stroke.color;
			ctx.lineWidth = this.stroke.width;
			ctx.stroke();
		}
		if (this.fill) {
			ctx.fillStyle = this.fill;
			ctx.fill();
		}
		ctx.closePath();
		ctx.globalAlpha = 1;
	}
}

const animate = anime({
	duration: Infinity,
	update: () => {
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, canvWidth, canvHeight);
		animations.forEach(anim => {
			anim.animatables.forEach(animatable => {
				animatable.target.draw();
			});
		});
	}
});

const resizeCanvas = () => {
	canvWidth = window.innerWidth;
	canvHeight = window.innerHeight;
	canv.width = canvWidth * devicePixelRatio;
	canv.height = canvHeight * devicePixelRatio;
	ctx.scale(devicePixelRatio, devicePixelRatio);
};

(function init() {
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);
	addClickListeners();
	if (!!window.location.pathname.match(/fullcpgrid/)) startFauxClicking();
	handleInactiveUser();
})();

function handleInactiveUser() {
	const inactive = setTimeout(() => {
		fauxClick(canvWidth / 2, canvHeight / 2);
	}, 2000);

	function clearInactiveTimeout() {
		clearTimeout(inactive);
		document.removeEventListener('mousedown', clearInactiveTimeout);
		document.removeEventListener('touchstart', clearInactiveTimeout);
	}

	document.addEventListener('mousedown', clearInactiveTimeout);
	document.addEventListener('touchstart', clearInactiveTimeout);
}

function startFauxClicking() {
	setTimeout(() => {
		fauxClick(anime.random(canvWidth * 0.2, canvWidth * 0.8), anime.random(canvHeight * 0.2, canvHeight * 0.8));
		startFauxClicking();
	}, anime.random(200, 900));
}

function fauxClick(x, y) {
	const fauxClick = new Event('mousedown');
	fauxClick.pageX = x;
	fauxClick.pageY = y;
	document.dispatchEvent(fauxClick);
}
