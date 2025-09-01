const C = [
	'\n4 10@\n_ 9',
	' 5# 5# 5# 5#\n 5# 5# 5# 5#\n 5# 11# 5#\n 5# 11# 5#\n_ 22#\n 11# 14@\n 11#\n 5# 5# 5#\n 5# 5# 5# 5#',
	' 5# 5# 5# 5#\n 5# 5# 5# 5#\n 5# 5# 5# 5#\n 5# 5# 5# 5#\n 5# 5# 5# 5# 2@\n_ 4# 5# 5# 5#\n 5# 5# 5# 5#\n 5# 5# 5# 5#\n 5# 5# 5# 5#'
];
const M = [
	_ => {
		const s = manager._scene;
		if (s.tiles.length) {
			s.data.TILES = s.tiles;
			s.tiles = [];
		} else {
			s.tiles = s.data.TILES;
		}
	},
	_ => {
		const s = manager._scene;
		s.tiles.push(new Tile(384, 192 - 48 * s.data.touch, '#'));
	},
	_ => {
		const s = manager._scene;
		const d = s.data;
		if (!d.touch) d.TILE = s.tiles.find(i => i.type == '@');
		d.TILE.type = d.touch % 2 ? '@' : '#';
	},
	_ => {
		[240, 288, 336, 384].forEach(y => {
			manager._scene.tiles.push(new Tile(384, y, '#'));
		});
	}
];
const LEVELS = [
	C[0],
	'\n\n#20\n\n 19@\n_20',
	{
		tiles: C[0],
		tap: M[2]
	},
	{
		tiles: C[0],
		tap: _ => {
			M[2]();
			manager._scene.data.TILE.x += 96;
		}
	},
	{
		tiles: ' 6#\n 6#\n 6#\n 6#\n 6# 4@\n_ 5#\n 6#\n 6#\n 6#',
		tap: M[0]
	},
	C[1],
	{
		tiles: C[1],
		tap: M[0]
	},
	{
		tiles: C[0],
		tap: M[1],
		init: M[3]
	},
	{
		tiles: C[0],
		tap: _ => {
			M[1]();
			M[2]();
		},
		init: M[3]
	},
	{
		tiles: C[2],
		tap: M[0]
	},
	'\n\n#20\n\n 19@\n_#19',
	{
		tiles: C[1],
		init: _ => {
			const s = manager._scene;
			const d = s.data;
			d.TILES = [1, 2].map(i => s.loadLevel(C[i]));
		},
		tap: _ => {
			manager._scene.tiles = manager._scene.data.TILES.reverse()[0];
		}
	}
];

class Scene_Start {
	touch = 0;
	constructor(m) {
		this.manager = m;
		this.refresh();
	}
	refresh() {
		this.items = this.manager.data.split('').filter(i => i == '@').map((_, i) => {
			return {
				x: 384 + i % 5 * 76,
				y: (i / 5 | 0) * 60 + 208 - LEVELS.length / 5 * 30 | 0,
				i: i
			};
		});
	}
	render() {
		const m = this.manager;
		ctx.save();
		ctx.clearRect(0, 0, 768, 432);
		ctx.strokeRect(0, 0, 768, 432);
		ctx.strokeRect(5, 5, 758, 422);
		ctx.strokeStyle = '#000';
		ctx.fillText('Mr. 13lackie', 230, 234);
		Cat.prototype.render.call({
			x: 50,
			y: 192
		});
		this.items.forEach(i => {
			ctx.strokeRect(i.x, i.y, 48, 48);
			ctx.fillText(`${i.i+1}`, i.x + 24, i.y + 38);
		});
		ctx.font = '18px Arial';
		ctx.fillText(`SOUND`, 54, 412);
		ctx.strokeRect(100, 392, 84, 26)
		ctx.fillText('ON', 120, 412);
		ctx.fillText('OFF', 162, 412);
		ctx.fillStyle = '#aaa';
		ctx.fillRect(102 + (m.mute ? 0 : 42), 394, 38, 22);
		ctx.fillStyle = '#fff';
		ctx.fillRect(104 + (m.mute ? 0 : 42), 396, 34, 18);
		ctx.fillStyle = '#000';
		ctx.fillText(`Programmer:EKMOMO  Music:AZZZ`, 600, 412);
		if (m.data.includes('!')) {
			ctx.translate(0, 0);
			ctx.rotate(-Math.PI / 4);
			ctx.fillStyle = '#a23';
			ctx.fillRect(-128, 64, 256, 48);
			ctx.fillStyle = '#fff';
			ctx.fillText("clear", 0, 100);
		}
		ctx.restore();
	}
	tap(e) {
		const m = this.manager;
		if (e.y > 384 && e.x < 180) {
			this.changeMute(m);
		} else if (m.isCollision(e, {
				x: 50,
				y: 192
			}, 2)) {
			this.touch++;
			m.speak(this.touch % 10 ? 'What the fuck are you tapping at' : 'AZ LAO SHI Niu B');
		} else {
			this.items.forEach(i => {
				if (m.isCollision(e, i, 2)) {
					m.goto(1);
					m._scene.init(i.i);
				}
			});
		}
		m.playMusic();
	}
	changeMute(m) {
		m.mute = !m.mute;
		m.stopPlay();
		m.playMusic();
	}
}

// 游戏场景
class Scene_Game {
	constructor() {

	}

	init(n = 0) {
		this.cat = new Cat(0, 192);
		this.currentLevel = n;
		this.cameraX = 0;
		this.gameover = 0;
		this.initLevel(this.currentLevel);
		this.data?.init?.(this);
		this.data.touch = 0;
	}

	initLevel(levelIndex) {
		this.data = LEVELS[levelIndex];
		if (typeof this.data == 'string') this.data = {
			tiles: this.data
		};
		this.tiles = this.loadLevel(this.data.tiles);
	}
	loadLevel(levelData) {
		const data = this.encodeLevel(levelData).split('\n');
		const tiles = [];
		for (let y = 0; y < data.length; y++) {
			for (let x = 0; x < data[y].length; x++) {
				const char = data[y][x];
				if (char !== ' ') {
					tiles.push(new Tile(
						x * 48,
						y * 48,
						char
					));
				}
			}
		}
		return tiles;
	}
	encodeLevel(data = '') {
		return data.replace(/(\D)(\d+)/g, (_, p1, p2) => p1.repeat(p2));
	}
	update() {
		if (this.gameover) return;
		this.cat.update();
		this.cameraX = Math.max(0, this.cat.x - 192);
		if (this.cat.y > 432) manager.gameover();
		this.cat.onFloor = 0;
		this.tiles.filter(tile => tile.x > this.cameraX - 48 && tile.x < this.cameraX + 768).forEach(tile => tile
			.checkCollision(this.cat));
		this.data?.update?.(this);
	}

	render() {
		ctx.clearRect(0, 0, 768, 432);
		if (!this.gameover) {
			ctx.save();
			ctx.translate(-this.cameraX, 0);
			this.tiles.forEach(tile => tile.render());
			this.cat.render();
			ctx.restore();
			this.data?.render?.(this);
		} else {
			const w = this.gameover == 'w';
			ctx.fillText(w ? 'Nice!!!' : 'Die', 369, 200);
			ctx.fillText(w ? 'You\'ve beaten the game.' : 'Tap to Retry', 369, 250);
		}
	}

	tap(e) {
		if (this.gameover == 'g') {
			this.init(this.currentLevel);
		} else if (this.gameover == 'w') {
			manager.goto(0);
		} else {
			this.cat.jump(e.time);
			this.data?.tap?.(this);
			this.data.touch++;
		}
	}
}

class Cat {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.velocity = 0;
		this.jumpCount = 0;
	}

	update() {
		if (this.velocity != 0) this.x += 3;
		if (!this.onFloor) this.velocity += 0.25;
		this.y += this.velocity;
	}
	jump(t) {
		this.velocity = -3 - t / 42 | 0;
		this.jumpCount++;
		const d = this.y - t / 4;
		manager.speak(d < -250 ? (d < -1000 ? 'motherfucking stratosphere' : 'm flying fucking high') : [...
			'oooouuuu'.split(''), 'fuck'
		].sort(_ => Math
			.random() * 2 - 1)[0]);
	}
	render() {
		ctx.save();
		const {
			x,
			y,
			velocity
		} = this;
		const fy = velocity > 0 ? 1 : -1;
		// 绘制身体
		ctx.fillStyle = '#000';
		ctx.fillRect(x + 12, y + 12, 36, 36);
		//绘制眼罩
		ctx.fillStyle = '#a23';
		ctx.fillRect(x + 12, y + 14, 36, 14);
		//绘制眼睛
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(x + 40, y + 20, 6, 0, 2 * Math.PI);
		ctx.arc(x + 28, y + 20, 6, 0, 2 * Math.PI);
		ctx.fill();
		ctx.fillStyle = '#000';
		ctx.fillRect(x + 30, y + 20 + fy, 2, 2);
		ctx.fillRect(x + 42, y + 20 + fy, 2, 2);
		//绘制尾巴
		ctx.lineCap = 'round';
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 8;
		ctx.beginPath();
		ctx.moveTo(x + 12, y + 36);
		ctx.bezierCurveTo(
			x - 10, y + 36, // 控制点
			x - 12, y, // 控制点
			x + 6, y + 12 // 终点
		);
		ctx.stroke();
		//抠出耳朵
		ctx.beginPath();
		ctx.moveTo(x + 12, y - 1);
		ctx.lineTo(x + 12, y + 14);
		ctx.lineTo(x + 30, y + 14);
		ctx.fill();
		ctx.moveTo(x + 30, y + 14);
		ctx.lineTo(x + 48, y - 1);
		ctx.lineTo(x + 48, y + 14);
		ctx.fill();
		ctx.restore();
	}
}


class Tile {
	constructor(x, y, type) {
		this.x = x;
		this.y = y;
		this.type = type;
	}

	render() {
		const size = 48;
		switch (this.type) {
			case '_':
				ctx.fillStyle = '#a52';
				ctx.fillRect(this.x, this.y, size, size);
				break;
			case '@':
				ctx.fillStyle = '#2a6';
				ctx.fillRect(this.x, this.y, size, size);
				break;
			case '#':
				ctx.fillStyle = '#a23';
				ctx.fillRect(this.x, this.y, size, size);
		}
	}
	checkCollision(cat) {
		if (manager.isCollision(cat, this)) {
			switch (this.type) {
				case '_':
					if (cat.x > this.x && cat.x < this.x + 48) {
						if (cat.velocity >= 0) {
							cat.velocity = 0;
							cat.y = this.y - 48;
						} else cat.velocity = -5;
						cat.onFloor = 1;
					}
					break;
				case '#':
					manager.gameover();
					break;
				case '@':
					manager.nextLevel();
					break;
				default:
					this.onFloor = 0;
			}
		}
	}
}

// 场景管理器
class Manager {
	audioCtx = new(AudioContext || webkitAudioContext)();
	oscillators = [];
	constructor() {
		this.resize();
		this.start();
	}
	resize() {
		const {
			width,
			height
		} = canvas;
		if (window.innerWidth / window.innerHeight > width / height) {
			this._scale = window.innerHeight / height;
			canvas.style.height = '100%';
			canvas.style.width = 'auto';
		} else {
			this._scale = window.innerWidth / width;
			canvas.style.width = '100%';
			canvas.style.height = 'auto';
		}
	}
	start() {
		this.load();
		this._scenes = [new Scene_Start(this), new Scene_Game()];
		this.goto(0);
		this.gameLoop();
	}
	goto(index) {
		this._scene = this._scenes[index];
		this._scene.refresh?.(this);
	}
	gameLoop() {
		if (this._scene) {
			this._scene.update && this._scene.update();
			this._scene.render();
		}
		requestAnimationFrame(() => this.gameLoop());
	}
	tap(e) {
		const x = e.offsetX / this._scale;
		const y = e.offsetY / this._scale;
		const time = performance.now() - this.touch;
		this._scene.tap({
			x,
			y,
			time
		});
	}
	isCollision(a, b, w = 48) {
		return a.x < b.x + 48 &&
			a.x + w > b.x &&
			a.y < b.y + 48 &&
			a.y + w > b.y;
	}
	playNote(pitch, duration, startTime) {
		const osc = this.audioCtx.createOscillator();
		const gain = this.audioCtx.createGain();
		osc.type = 'triangle';
		osc.frequency.value = pitch * 10;
		gain.gain.setValueAtTime(0.3, startTime);
		osc.connect(gain).connect(this.audioCtx.destination);
		osc.start(startTime);
		gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
		osc.stop(startTime + duration + 0.05);
		osc.onended = _ => {
			this.oscillators = this.oscillators.filter(i => i !== osc);
		};
		this.oscillators.push(osc);
	}
	playScore(score = [], loop = 0) {
		this.stopPlay();
		let time = this.audioCtx.currentTime;
		score.forEach(note => {
			const n = (note + '').split('@');
			const t = n[1] || 0.2;
			this.playNote(n[0], t, time);
			time += t;
		});
		if (loop) {
			this.looper = setTimeout(this.playScore.bind(this, score, loop), (time - this.audioCtx.currentTime) *
				1000);
		}
		return this.looper;
	}
	stopPlay() {
		this.oscillators.forEach(osc => {
			try {
				osc.stop();
				osc.disconnect();
			} catch (e) {}
		});
		if (this.looper) {
			clearTimeout(this.looper);
			this.looper = null;
		}
		this._music = null;
	}
	playMusic() {
		if (this.mute) return;
		this._music = this._music || this.playScore([13, 27, 34, 27, 27, 27, 27, 26, 31, 31, 31, 31, 31, 31, 36, 31,
			36, 36, 36, 36, 31, 34, 31, 31, 31, 34, 31, 27, 34, 27, 34, 34, 41, 34, 41, 27, 34, 23, 31, 23,
			31, 36, 31, 36, 36, 31, 36, 18, 23, 18, 23, 27, 27, 23, 13, 27, 13, 27, 34, 34, 13, 27
		], 1);
	}
	speak(text) {
		if (this.mute) return;
		speechSynthesis.cancel();
		this._speak = new SpeechSynthesisUtterance(text);
		speechSynthesis.speak(this._speak);
	}
	nextLevel() {
		const s = this._scene;
		const c = ++s.currentLevel;
		if (c >= LEVELS.length) {
			this.gameover(1);
			this.data += '!';
		} else {
			s.init(c);
			if (this.data.length <= c) {
				this.data += '@';
			}
		};
		this.save();
	}
	gameover(win = 0) {
		this.speak(win ? 'congratulations' : 'whatthefuck');
		this._scene.gameover = win ? 'w' : 'g';
	}
	save() {
		localStorage.setItem('EK_MR13LACKIE', this.data);
	}
	load() {
		this.data = localStorage.getItem('EK_MR13LACKIE') || '@';
	}
}

const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d');
ctx.font = 'bold 36px Arial';
ctx.textAlign = 'center';
ctx.fillStyle = '#000';
const manager = new Manager();
canvas.addEventListener('pointerdown', e => manager.touch = performance.now());
canvas.addEventListener('pointerup', e => manager.tap(e));
document.addEventListener('keydown', e => (e.keyCode == 27) && manager.goto(0));
window.addEventListener('resize', e => manager.resize());