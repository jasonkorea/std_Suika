import { Bodies, Engine, Render, Runner, World, Body, Events } from "matter-js";
import { FRUITS } from "./fruits";

const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.body,
  options: {
    wireframes: false,
    background: "#F7F4C8", // background color
    width: 620,
    height: 850,
  },
});

const world = engine.world;

/** 왼쪽 벽 */
const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});
/** 오른쪽 벽 */
const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});
/** 바닥 벽 */
const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});
/** 천장 벽 */
const topLine = Bodies.rectangle(310, 150, 620, 2, {
  name: "topLine",
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});

World.add(world, [leftWall, rightWall, ground, topLine]);

Render.run(render);
Runner.run(engine);

let currentBody = null;
let currentFruit = null;
let disableAction = false;
let isDragging = false;

/** 과일을 생성하는 함수 */
function addFruit() {
  const index = Math.floor(Math.random() * 5);
  const fruit = FRUITS[index];

  const initialX = window.lastMouseX ? window.lastMouseX - render.canvas.getBoundingClientRect().left : 300;

  const body = Bodies.circle(initialX, 50, fruit.radius, {
    index: index,
    isSleeping: true,
    render: {
      sprite: { texture: `${fruit.label}.png` },
    },
    restitution: 0.2, // 과일의 탄성 설정
  });

  currentBody = body;
  currentFruit = fruit;
  disableAction = false; // 과일 생성 후 바로 조작 가능하도록 설정

  World.add(world, body);

  // 새로운 과일이 생성될 때 마우스 위치 반영
  if (isDragging) {
    handleMove({ clientX: window.lastMouseX });
  }
}

// 드래그 중 이동 함수
function moveDrag(x) {
  if (disableAction) return;

  // 마우스의 x 좌표를 캔버스 내 좌표로 변환 (반응형 고려)
  const canvasBounds = render.canvas.getBoundingClientRect();
  const adjustedX = x - canvasBounds.left;

  // 벽을 넘어가지 않도록 제한
  if (
    currentBody &&
    adjustedX - currentFruit.radius > 30 &&
    adjustedX + currentFruit.radius < 590
  ) {
    Body.setPosition(currentBody, {
      x: adjustedX,
      y: currentBody.position.y,
    });
  }
}

// 드래그 종료 함수
function endDrag() {
  if (disableAction) return;

  isDragging = false;
  currentBody.isSleeping = false;
  disableAction = true;

  // 0.5초 뒤에 새로운 과일 생성
  setTimeout(() => {
    disableAction = false;
    addFruit();
  }, 500);
}

// 게임을 재시작하는 함수
function restartGame() {
  // 월드에서 모든 바디 제거
  World.clear(world, true);

  // 엔진 재설정
  Engine.clear(engine);

  // 벽 및 바닥 다시 추가
  World.add(world, [leftWall, rightWall, ground, topLine]);

  // 과일 다시 추가
  disableAction = false;
  isDragging = false;
  addFruit();
}

// 공통 이벤트 핸들러
function handleMove(event) {
  const x = event.clientX || (event.touches && event.touches[0]?.clientX);
  if (x !== undefined) {
    window.lastMouseX = x;
    moveDrag(x);
  }
}

function handleEnd(event) {
  if (event.type === "mouseup" || event.type === "touchend") {
    endDrag();
  }
}

// 터치 및 마우스 이벤트 핸들러
window.addEventListener("touchmove", handleMove);
window.addEventListener("touchend", handleEnd);
window.addEventListener("mousemove", handleMove);
window.addEventListener("mouseup", handleEnd);

window.addEventListener("mousedown", (event) => {
  const x = event.clientX;
  if (x !== undefined) {
    isDragging = true;
    window.lastMouseX = x;
    moveDrag(x);
  }
});

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    if (collision.bodyA.index === collision.bodyB.index) {
      const index = collision.bodyA.index;
      if (index === FRUITS.length - 1) {
        return;
      }
      World.remove(world, [collision.bodyA, collision.bodyB]);

      const newFruit = FRUITS[index + 1];
      const newBody = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: {
            sprite: { texture: `${newFruit.label}.png` },
          },
          index: index + 1,
        }
      );
      World.add(world, newBody);
    }

    if (
      !disableAction &&
      (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")
    ) {
      alert("Game over!");
      restartGame();
    }
  });
});

addFruit();
