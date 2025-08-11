(() => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    innerWidth / innerHeight,
    0.1,
    2000
  );
  camera.position.z = 80;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  function getCounts(mode) {
    if (mode === "low") return { texts: 100, hearts: 50 };
    if (mode === "med") return { texts: 200, hearts: 100 };
    if (mode === "high") return { texts: 400, hearts: 200 };
    return isMobile ? { texts: 150, hearts: 80 } : { texts: 350, hearts: 150 };
  }

  function createTextTexture(text) {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const w = 512,
      h = 128;
    c.width = w;
    c.height = h;
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,0,200,0.8)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#fff";
    ctx.fillText(text, w / 2, h / 2);
    return new THREE.CanvasTexture(c);
  }

  function createHeartTexture() {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    c.width = c.height = 64;
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(32, 24);
    ctx.bezierCurveTo(52, 0, 64, 20, 32, 60);
    ctx.bezierCurveTo(0, 20, 12, 0, 32, 24);
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  const textTex = createTextTexture("I LOVE YOU EVA");
  const heartTex = createHeartTexture();

  let qualityMode = "auto";
  let { texts, hearts } = getCounts(qualityMode);

  const planeGeo = new THREE.PlaneGeometry(18, 4.5);
  const textMat = new THREE.MeshBasicMaterial({
    map: textTex,
    transparent: true,
    depthWrite: false,
  });
  const textMesh = new THREE.InstancedMesh(planeGeo, textMat, texts);
  const tempObj = new THREE.Object3D();
  let textSpeeds = [];
  for (let i = 0; i < texts; i++) {
    tempObj.position.set(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 400
    );
    tempObj.rotation.x = Math.random() * 0.5;
    const s = 0.8 + Math.random() * 0.8;
    tempObj.scale.set(s, s, s);
    tempObj.updateMatrix();
    textMesh.setMatrixAt(i, tempObj.matrix);
    textSpeeds.push(0.2 + Math.random() * 0.5);
  }
  scene.add(textMesh);

  const heartGeo = new THREE.BufferGeometry();
  const heartPos = [];
  const heartSpeed = [];
  for (let i = 0; i < hearts; i++) {
    heartPos.push(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 400
    );
    heartSpeed.push(0.1 + Math.random() * 0.3);
  }
  heartGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(heartPos, 3)
  );
  const heartMat = new THREE.PointsMaterial({
    map: heartTex,
    size: 6,
    transparent: true,
    depthWrite: false,
  });
  const heartPoints = new THREE.Points(heartGeo, heartMat);
  scene.add(heartPoints);

  let paused = false;
  document.getElementById("toggle").onclick = () => {
    paused = !paused;
    document.getElementById("toggle").textContent = paused ? "Resume" : "Pause";
  };

  document.getElementById("quality").onchange = (e) => {
    qualityMode = e.target.value;
    ({ texts, hearts } = getCounts(qualityMode));
  };

  function animate() {
    requestAnimationFrame(animate);
    if (paused) return;

    const time = Date.now() * 0.0002;
    camera.position.x = Math.cos(time) * 20;
    camera.position.y = Math.sin(time * 0.7) * 6;
    camera.lookAt(0, 0, 0);

    for (let i = 0; i < texts; i++) {
      textMesh.getMatrixAt(i, tempObj.matrix);
      tempObj.matrix.decompose(
        tempObj.position,
        tempObj.quaternion,
        tempObj.scale
      );
      tempObj.position.z += textSpeeds[i];
      if (tempObj.position.z > 200) tempObj.position.z = -200;
      tempObj.updateMatrix();
      textMesh.setMatrixAt(i, tempObj.matrix);
    }
    textMesh.instanceMatrix.needsUpdate = true;

    const pos = heartGeo.attributes.position.array;
    for (let i = 0; i < hearts; i++) {
      pos[i * 3 + 1] += heartSpeed[i];
      if (pos[i * 3 + 1] > 60) pos[i * 3 + 1] = -60;
    }
    heartGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();
})();
