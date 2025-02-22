
// ---------------------------------------------
// Screen data
// ---------------------------------------------

let screendata =
{
	canvas:    null,
	context:   null,
	imagedata: null,

	bufarray:  null, // color data
	buf8:      null, // the same array but with bytes
	buf32:     null, // the same array but with 32-Bit words

	backgroundcolor: 0xFFE09090
};
// ---------------------------------------------

let updaterunning = false;

// ---------------------------------------------
// Fast way to draw vertical lines

function DrawVerticalLine(x, ytop, ybottom, col)
{
	x = x|0;
	ytop = ytop|0;
	ybottom = ybottom|0;
	col = col|0;
	let buf32 = screendata.buf32;
	let screenwidth = screendata.canvas.width|0;
	if (ytop < 0) ytop = 0;
	if (ytop > ybottom) return;

	// get offset on screen for the vertical line
	let offset = ((ytop * screenwidth) + x)|0;
	for (let k = ytop|0; k < ybottom|0; k=k+1|0)
	{
		buf32[offset|0] = col|0;
		offset = offset + screenwidth|0;
	}
}

// ---------------------------------------------
// Basic screen handling

function DrawBackground()
{
	let buf32 = screendata.buf32;
	let color = screendata.backgroundcolor|0;
	for (let i = 0; i < buf32.length; i++) buf32[i] = color|0;
}

// Show the back buffer on screen
function Flip()
{
	screendata.imagedata.data.set(screendata.buf8);
	screendata.context.putImageData(screendata.imagedata, 0, 0);
}

// ---------------------------------------------
// The main render routine

function Render()
{
	let mapwidthperiod = map.width - 1;
	let mapheightperiod = map.height - 1;

	let screenwidth = screendata.canvas.width|0;
	let sinang = Math.sin(camera.angle);
	let cosang = Math.cos(camera.angle);

	let hiddeny = new Int32Array(screenwidth);
	for(let i=0; i<screendata.canvas.width|0; i=i+1|0)
		hiddeny[i] = screendata.canvas.height;

	let deltaz = 1.;

	// Draw from front to back
	for(let z=1; z<camera.distance; z+=deltaz)
	{
		// 90 degree field of view
		let plx =  -cosang * z - sinang * z;
		let ply =   sinang * z - cosang * z;
		let prx =   cosang * z - sinang * z;
		let pry =  -sinang * z - cosang * z;

		let dx = (prx - plx) / screenwidth;
		let dy = (pry - ply) / screenwidth;
		plx += camera.x;
		ply += camera.y;
		let invz = 1. / z * 240.;
		for(let i=0; i<screenwidth|0; i=i+1|0)
		{
			let mapoffset = ((Math.floor(ply) & mapwidthperiod) << map.shift) + (Math.floor(plx) & mapheightperiod)|0;
			let heightonscreen = (camera.height - map.altitude[mapoffset]) * invz + camera.horizon|0;
			DrawVerticalLine(i, heightonscreen|0, hiddeny[i], map.color[mapoffset]);
			if (heightonscreen < hiddeny[i]) hiddeny[i] = heightonscreen;
			plx += dx;
			ply += dy;
		}
		deltaz += 0.005;
	}
}


// ---------------------------------------------
// Draw the next frame

function Draw()
{
	updaterunning = true;
	UpdateCamera();
	DrawBackground();
	Render();
	Flip();
	frames++;

	if (!input.keypressed)
	{
		updaterunning = false;
	} else
	{
		window.requestAnimationFrame(Draw, 0);
	}
}

