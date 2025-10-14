(()=>{
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    
    // 1. 🖼️ Load the logo image for the bird
    const logoImg = new Image();
    logoImg.src = 'logo_black-removebg-preview.png'; 
    logoImg.crossOrigin = 'anonymous'; 

    // 2. 🏞️ Load the background image
    const backgroundImg = new Image();
    backgroundImg.src = 'Rialo banner.png'; 
    backgroundImg.crossOrigin = 'anonymous';

    // Game variables
    let frames = 0;
    let score = 0;
    let pipes = [];
    let speed = 4.0; 
    let running = false;

    // Bird (scaled 2x)
    const bird = {
        x: 180, // Scaled 90 -> 180
        y: H/2,
        w: 80, // Scaled 40 -> 80
        h: 80, // Scaled 40 -> 80
        vy: 0,
        gravity: 1.2, // Scaled 0.6 -> 1.2
        lift: -18, // Scaled -9 -> -18
        rotate: 0,
        reset(){ this.y = H/2; this.vy=0; this.rotate=0 },
        flap(){ this.vy = this.lift; }
    };

    // Ground (scaled 2x)
    const ground = {h: 160}; 

    // Pipes factory (scaled 2x)
    function spawnPipe(){
        const gap = 280; // Scaled 140 -> 280
        const minH = 100; // Scaled 50 -> 100
        const topH = Math.floor(minH + Math.random()*(H - ground.h - gap - minH*2));
        pipes.push({x: W, w: 120, top: topH, bottom: topH + gap, passed:false}); // w scaled 60 -> 120
    }

    // Input
    function flap(){ if(!running) startGame(); bird.flap(); }
    window.addEventListener('keydown', e=>{ if(e.code==='Space') { e.preventDefault(); flap(); } });
    canvas.addEventListener('mousedown', flap);
    canvas.addEventListener('touchstart', e=>{ e.preventDefault(); flap(); });

    // Start / Restart
    document.getElementById('start').addEventListener('click', startGame);
    function startGame(){
        frames = 0; score = 0; pipes = []; speed = 4.0; running = true; bird.reset(); spawnPipe(); updateScoreUI(); 
    }

    // Collision check (rectangle-based)
    function collideBirdPipe(b, p){
        const bx1 = b.x, bx2 = b.x + b.w, by1 = b.y, by2 = b.y + b.h;
        const t1x = p.x, t1x2 = p.x + p.w, t1y1 = 0, t1y2 = p.top;
        const b1x = p.x, b1x2 = p.x + p.w, b1y1 = p.bottom, b1y2 = H - ground.h;
        function overlap(ax1,ax2,ay1,ay2, bx1,bx2,by1,by2){
            return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
        }
        if(overlap(bx1,bx2,by1,by2, t1x,t1x2,t1y1,t1y2)) return true;
        if(overlap(bx1,bx2,by1,by2, b1x,b1x2,b1y1,b1y2)) return true;
        return false;
    }

    // Draw helpers
    function drawBird(b){
        ctx.save();
        ctx.translate(b.x + b.w/2, b.y + b.h/2); 
        ctx.rotate(b.rotate);

        // Draw a circle (ball)
        ctx.beginPath();
        ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; 
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2; 
        ctx.stroke();
        ctx.closePath();

        // Draw the logo image
        if (logoImg.complete) {
            ctx.drawImage(logoImg, -b.w / 2, -b.h / 2, b.w, b.h);
        }

        ctx.restore();
    }

    function drawPipes(){
        ctx.fillStyle = '#2e8b57';
        for(const p of pipes){
            // top
            ctx.fillRect(p.x, 0, p.w, p.top);
            // bottom
            ctx.fillRect(p.x, p.bottom, p.w, H-ground.h - p.bottom);
        }
    }

    function drawGround(){
        ctx.fillStyle = 'saddlebrown';
        ctx.fillRect(0, H-ground.h, W, ground.h);
        // simple stripes - Scaled 2x
        ctx.fillStyle = 'rgba(0,0,0,.06)';
        for(let i=0;i<20;i++) ctx.fillRect(i*80 + ((frames*4)%80), H-ground.h+20, 40, 16);
    }

    function update(){
        frames++;
        // spawn pipes
        if(frames % 120 === 0) spawnPipe();
        // bird physics
        bird.vy += bird.gravity; bird.y += bird.vy;
        // rotation based on vy
        bird.rotate = Math.max(-0.6, Math.min(0.9, bird.vy/18)); 

        // move pipes
        for(const p of pipes){ p.x -= speed; }
        // remove offscreen
        pipes = pipes.filter(p=> p.x + p.w > -100); 

        // scoring & collision
        for(const p of pipes){
            if(!p.passed && p.x + p.w < bird.x){ p.passed = true; score++; updateScoreUI(); if(score%5===0) speed += 0.6; } 
            if(collideBirdPipe(bird,p)){ endGame(); }
        }

        // ground collision
        if(bird.y + bird.h > H - ground.h){ endGame(); }
        
        // Upper Boundary check (The "glitch" fix)
        if(bird.y < 0) {
            bird.y = 0;
            bird.vy = 0; 
        }
    }

    function endGame(){ running = false; document.getElementById('start').textContent = 'Restart'; }

    function updateScoreUI(){ document.getElementById('score').textContent = score; }

    // Function for drawing the background image using "cover" logic (Fills canvas without stretching)
    function drawBackgroundCover(img, canvasW, canvasH) {
        if (!img.complete) return;

        const imgW = img.width;
        const imgH = img.height;
        const canvasAspect = canvasW / canvasH;
        const imgAspect = imgW / imgH;

        let drawX = 0;
        let drawY = 0;
        let drawW = canvasW;
        let drawH = canvasH;
        let sourceX = 0;
        let sourceY = 0;
        let sourceW = imgW;
        let sourceH = imgH;

        if (imgAspect > canvasAspect) {
            // Image is wider, clip left/right
            sourceW = imgH * canvasAspect;
            sourceX = (imgW - sourceW) / 2;
        } else {
            // Image is taller, clip top/bottom
            sourceH = imgW / canvasAspect;
            sourceY = (imgH - sourceH) / 2;
        }

        ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, drawX, drawY, drawW, drawH);
    }

    function render(){
        // Draw the background image onto the canvas, covering it seamlessly
        if (backgroundImg.complete) {
            drawBackgroundCover(backgroundImg, W, H);
        } else {
            // Fallback
            ctx.clearRect(0,0,W,H);
        }
        
        // pipes
        drawPipes();
        // bird
        drawBird(bird);
        // ground
        drawGround();

        // 🚀 MODIFIED CODE: Center and enlarge "Railo flappy bird" within the ground area
        const fontSize = 56;
        const textYOffset = 20; // Fine-tuning offset to visually center the baseline
        
        ctx.font = `${fontSize}px system-ui`; 
        ctx.fillStyle = '#111'; 
        ctx.strokeStyle = '#fff'; 
        ctx.lineWidth = 6; 
        const titleText = 'Railo flappy bird';
        
        // Calculate Y position to center the text vertically in the ground area (H - ground.h) to H
        // Center Y position: H - (ground.h / 2)
        // Adjust for baseline: + (fontSize / 3) is a common visual trick, using textYOffset for simple adjustment
        const centerY = H - (ground.h / 2) + textYOffset; 

        // Calculate X position to center the text horizontally
        const textX = W/2 - ctx.measureText(titleText).width/2;

        ctx.strokeText(titleText, textX, centerY); 
        ctx.fillText(titleText, textX, centerY);
        // 🚀 END MODIFIED CODE

        // overlay score - Scaled 2x
        ctx.font = '72px system-ui'; 
        ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 8; 
        const s = String(score);
        ctx.strokeText(s, W/2 - ctx.measureText(s).width/2, 120); 
        ctx.fillText(s, W/2 - ctx.measureText(s).width/2, 120);

        if(!running){
            ctx.fillStyle = 'rgba(0,0,0,.5)';
            ctx.fillRect(W/2 - 320, H/2 - 96, 640, 192); 
            ctx.fillStyle = '#fff'; ctx.font = '40px system-ui'; 
            ctx.fillText('Click / Space to Flap — Press Start', W/2 - 300, H/2 ); 
        }
    }

    function loop(){
        if(running) update();
        render();
        requestAnimationFrame(loop);
    }

    // Start the game loop only after both images are loaded
    let imagesLoaded = 0;
    const totalImages = 2;

    const imageLoadCheck = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            loop();
        }
    };

    // Set up listeners for the two images
    logoImg.onload = imageLoadCheck;
    backgroundImg.onload = imageLoadCheck;

    // Fallback if images are already cached
    if (logoImg.complete) imageLoadCheck();
    if (backgroundImg.complete) imageLoadCheck();

  })();