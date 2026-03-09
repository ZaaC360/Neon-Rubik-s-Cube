import * as THREE from 'three';
        import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
        import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(6, 5, 7);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.2; 
        document.body.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = true;

       
        const renderScene = new RenderPass(scene, camera);
        
        
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.6, 0.1);
        
        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        // --- Cube Construction ---
        const cubies = [];
        const cubeGroup = new THREE.Group();
        scene.add(cubeGroup);

        // Classic Rubik's Colors (Red, Orange, White, Yellow, Green, Blue)
        // I used a slightly lighter blue (0x0066ff) because pure dark blue doesn't glow well as a neon light!
        const colors = [
            new THREE.Color(0xff0000).multiplyScalar(1.5), // Right: Red
            new THREE.Color(0xff6600).multiplyScalar(1.5), // Left: Orange
            new THREE.Color(0xffffff).multiplyScalar(1.5), // Top: White
            new THREE.Color(0xffff00).multiplyScalar(1.5), // Bottom: Yellow
            new THREE.Color(0x00ff00).multiplyScalar(1.5), // Front: Green
            new THREE.Color(0x0066ff).multiplyScalar(1.5)  // Back: Blue
        ];
        
        
        const blackCoreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const coreGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);

        
        function createThickGlowingFrame(color, rotX, rotY, rotZ, posX, posY, posZ) {
            const frameGroup = new THREE.Group();
            const mat = new THREE.MeshBasicMaterial({ color: color });

            const thickness = 0.06; // Thickness of the neon lines
            const size = 0.95;
            const innerSize = size - (thickness * 2);
        
            const horizGeo = new THREE.PlaneGeometry(size, thickness);
            const topBar = new THREE.Mesh(horizGeo, mat);
            topBar.position.set(0, (size - thickness) / 2, 0);
            
            const bottomBar = new THREE.Mesh(horizGeo, mat);
            bottomBar.position.set(0, -(size - thickness) / 2, 0);

            
            const vertGeo = new THREE.PlaneGeometry(thickness, innerSize);
            const leftBar = new THREE.Mesh(vertGeo, mat);
            leftBar.position.set(-(size - thickness) / 2, 0, 0);

            const rightBar = new THREE.Mesh(vertGeo, mat);
            rightBar.position.set((size - thickness) / 2, 0, 0);

            frameGroup.add(topBar, bottomBar, leftBar, rightBar);
            
            frameGroup.rotation.set(rotX, rotY, rotZ);
            frameGroup.position.set(posX, posY, posZ);
            return frameGroup;
        }

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const cubieGroup = new THREE.Group();
                    
                    const core = new THREE.Mesh(coreGeo, blackCoreMat);
                    cubieGroup.add(core);

                    const offset = 0.476; 
                    if (x === 1)  cubieGroup.add(createThickGlowingFrame(colors[0], 0, Math.PI/2, 0, offset, 0, 0));
                    if (x === -1) cubieGroup.add(createThickGlowingFrame(colors[1], 0, -Math.PI/2, 0, -offset, 0, 0));
                    if (y === 1)  cubieGroup.add(createThickGlowingFrame(colors[2], -Math.PI/2, 0, 0, 0, offset, 0));
                    if (y === -1) cubieGroup.add(createThickGlowingFrame(colors[3], Math.PI/2, 0, 0, 0, -offset, 0));
                    if (z === 1)  cubieGroup.add(createThickGlowingFrame(colors[4], 0, 0, 0, 0, 0, offset));
                    if (z === -1) cubieGroup.add(createThickGlowingFrame(colors[5], 0, Math.PI, 0, 0, 0, -offset));

                    cubieGroup.position.set(x, y, z);
                    cubies.push(cubieGroup);
                    cubeGroup.add(cubieGroup);
                }
            }
        }

        // --- Rotation Logic ---
        let isAnimating = false;
        const pivot = new THREE.Group();
        scene.add(pivot);

        window.rotateLayer = function(axis, layer, direction) {
            if (isAnimating) return;
            isAnimating = true;

            const activeCubies = [];
            
            cubies.forEach(cubie => {
                if (Math.round(cubie.position[axis]) === layer) {
                    activeCubies.push(cubie);
                }
            });

            activeCubies.forEach(cubie => {
                pivot.attach(cubie);
            });

            const targetAngle = (Math.PI / 2) * direction;
            let currentAngle = 0;
            const rotationSpeed = 0.12 * direction;

            function animateRotation() {
                if (Math.abs(currentAngle) < Math.abs(targetAngle)) {
                    pivot.rotation[axis] += rotationSpeed;
                    currentAngle += rotationSpeed;
                    requestAnimationFrame(animateRotation);
                } else {
                    pivot.rotation[axis] = targetAngle;
                    
                    activeCubies.forEach(cubie => {
                        cubeGroup.attach(cubie);
                        cubie.position.set(
                            Math.round(cubie.position.x),
                            Math.round(cubie.position.y),
                            Math.round(cubie.position.z)
                        );
                    });

                    pivot.rotation.set(0, 0, 0);
                    isAnimating = false;
                }
            }
            animateRotation();
        }

        // --- Keyboard Listener ---
        window.addEventListener('keydown', (e) => {
            if (isAnimating) return;
            const key = e.key.toUpperCase();
            const shiftPressed = e.shiftKey;
            const direction = shiftPressed ? 1 : -1;

            switch(key) {
                case 'W': window.rotateLayer('y', 1, direction); break;
                case 'S': window.rotateLayer('y', -1, -direction); break;
                case 'A': window.rotateLayer('x', -1, direction); break;
                case 'D': window.rotateLayer('x', 1, -direction); break;
                case 'F': window.rotateLayer('z', 1, direction); break;
                case 'B': window.rotateLayer('z', -1, -direction); break;
            }
        });

        // --- Render Loop ---
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            composer.render();
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        });

        animate();