// ✅ 공통 상수
const API_BASE = "https://modami-server.onrender.com";


const OPENAI_API_KEY = ""; 


// ✅ 가장 최근의 요약 데이터 키 찾기
function getLatestSummaryKey(stageKey) {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(`summary_${stageKey}_`));
  if (keys.length === 0) return null;
  // 최신순 정렬
  keys.sort((a, b) => b.localeCompare(a));
  return keys[0];
}


document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const stageParam = params.get("stage") || "child";
  console.log("🧭 현재 인터뷰 stage:", stageParam);
  // ✅ 인터뷰 로드 호출
  loadFollowupQuestions(stageParam);

  // ✅ stage별 이름과 연령대
  const stageNames = {
    child: { label: "유아기 (0~12세)", bg: "child2_bg.svg" },
    teen: { label: "청소년기 (13~19세)", bg: "teen2_bg.svg" },
    adult: { label: "성인기 (20~39세)", bg: "adult2_bg.svg" },
    middle: { label: "중년기 (40~64세)", bg: "middle2_bg.svg" },
    senior: { label: "노년기 (65세~현재)", bg: "senior2_bg.svg" },
  };

  const stageInfo = stageNames[stageParam] || stageNames.child;

// ✅ 네비게이션 제목 변경
const stageTitleEl = document.getElementById("page-title"); // ← 수정됨
if (stageTitleEl) stageTitleEl.textContent = stageInfo.label;

// ✅ 배경 이미지 변경
const bgContainer = document.getElementById("hero-image"); // ← 수정
if (bgContainer) bgContainer.src = `image/${stageInfo.bg}`;



});





/***********************
 * 🔓 Chrome autoplay unlock (페이지 진입 시 자동 허용)
 ***********************/
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

async function unlockAudioContext() {
  try {
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    // ✅ 자동 unlock용 무음 오디오 실행
    const silentBuffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(audioCtx.destination);
    source.start(0);

    console.log("🔊 오디오 자동 재생 허용됨");
  } catch (e) {
    console.warn("⚠️ 오디오 자동 허용 실패:", e);
  }
}

document.addEventListener("DOMContentLoaded", unlockAudioContext);


/***********************
 * 🪄 오디오 자동 재생 허용 + 최초 클릭 보장
 ***********************/
let userInteracted = false;

async function ensureAudioPermission() {
  if (userInteracted) return; // 이미 허용됨
  return new Promise((resolve) => {
    const handler = () => {
      userInteracted = true;
      if (audioCtx.state === "suspended") audioCtx.resume();

      // ✅ 브라우저가 오디오 재생 허용하도록 무음 오디오 실행
      const unlock = new Audio();
      unlock.src = "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAA...";
      unlock.volume = 0;
      unlock.play().catch(() => {});
      document.body.removeEventListener("click", handler);
      resolve();
    };

    // 첫 클릭 대기
    document.body.addEventListener("click", handler);
  });
}


/*********************
 * 🔹 기본 엘리먼트
 *********************/
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SR ? new SR() : null;

const answerEl = document.getElementById("answer");
const guideEl = document.getElementById("guide-text");
const outEl = document.getElementById("output-text");
const btnStart = document.getElementById("btn-record-start");
const btnStop = document.getElementById("btn-stop");
const btnRestart = document.getElementById("btn-restart");
const btnNext = document.getElementById("btn-next");
const btnPrev = document.getElementById("btn-prev");
const pageTitleEl = document.getElementById("page-title");
const questionTextEl = document.getElementById("question-text");
const heroVideoEl = document.getElementById("character-video"); // <video> 엘리먼트 (HTML에 추가)



/*********************
 * 🎬 캐릭터 상태 전환 (GIF 버전 — 3단계 상태)
 *********************/
const heroGifEl = document.getElementById("character-video"); // <img> 요소

function setCharacterState(state) {
  if (!heroGifEl) return;

  const gifMap = {
    waiting: ["gif/waiting01.gif", "gif/waiting02.gif"],
    talking: ["gif/talking01.gif", "gif/talking02.gif"],
    listening: ["gif/listening01.gif"]
  };

  if (!gifMap[state]) return;

  // 상태가 같더라도 동일 이미지면 강제 리로드 시도
  const gifs = gifMap[state];
  const randomSrc = gifs[Math.floor(Math.random() * gifs.length)];

  // ✅ 동일 파일도 다시 로드되도록 쿼리스트링 추가
  const cacheBuster = `?v=${Date.now()}`;

  heroGifEl.dataset.state = state;
  heroGifEl.src = randomSrc + cacheBuster;

  console.log(`🎞️ 캐릭터 상태 → ${state}`);
}

/*********************
 * ⏸ 대기 상태 (waiting)
 *********************/
function pauseCharacter() {
  if (!heroGifEl) return;
  const waitingGifs = ["gif/waiting01.gif", "gif/waiting02.gif"];
  heroGifEl.src = waitingGifs[Math.floor(Math.random() * waitingGifs.length)];
  heroGifEl.dataset.state = "waiting";
}





/*********************
 * 🔊 TTS (narration.js 참고)
 *********************/
async function getTtsAudio(textScript) {
  if (window.APP_MODE?.MOCK || !window.APP_MODE?.TTS) {
    console.log("🔇 [MOCK TTS] 음성 생략:", textScript);
    return null; // 그냥 텍스트만 출력
  }

  try {
    const res = await fetch(`${API_BASE}/api/tts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: textScript })
});

    const data = await res.json();
    if (!data.audioContent) return null;

    const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
    const audio = new Audio(audioUrl);
    return new Promise((resolve) => {
      audio.addEventListener("loadedmetadata", () => {
        resolve({ audio, duration: audio.duration || 2 });
      });
    });
  } catch (e) {
    console.error("TTS 오류:", e);
    return null;
  }
}


/*********************
 * ⌨️ 타닥타닥 효과
 *********************/
async function typeWriter(el, text, ttsScript) {
  if (!el || !text) return;

  el.innerHTML = "";

  // ⚠️ 여기서 미리 talking으로 두지 말고,
  // 오디오 재생 직전에만 실행해야 함.

  const audioData = await getTtsAudio(ttsScript);
  if (!audioData) {
    let i = 0;
    const typingSpeed = 40;
    const interval = setInterval(() => {
      el.innerHTML = text.slice(0, i);
      i++;
      if (i > text.length) clearInterval(interval);
    }, typingSpeed);
    return;
  }

  const { audio, duration } = audioData;

  // ✅ 오디오 실제 재생이 시작되면 talking으로 전환
  audio.addEventListener("play", () => {
    setCharacterState("talking");
  });

  // ✅ 오디오 끝나면 waiting으로
  audio.addEventListener("ended", () => {
    pauseCharacter();
  });

  // 🎵 재생 시작
  audio.play().catch(e => console.error("TTS 재생 실패:", e));

  const pureText = text.replace(/<br>/g, "\n").replace(/<[^>]*>/g, "").trim();
  const totalChars = pureText.length;
  let typed = 0, idx = 0;

  const typingInterval = setInterval(() => {
    if (audio.ended) {
      clearInterval(typingInterval);
      el.innerHTML = text;
      return;
    }

    const elapsed = audio.currentTime;
    const targetChars = Math.min(totalChars, Math.floor(elapsed * (totalChars / duration)));

    while (typed < targetChars && idx < text.length) {
      const char = text.charAt(idx);
      if (char === "<") {
        const tagEnd = text.indexOf(">", idx);
        el.innerHTML += text.substring(idx, tagEnd + 1);
        idx = tagEnd + 1;
      } else {
        el.innerHTML += char;
        idx++;
        typed++;
      }
    }
  }, 30);
}



/*********************
 * 🎤 STT (녹음 기능)
 *********************/
let recognizing = false;
let finalBuf = "";
let lastInterim = "";
const answers = {}; // 질문별 전사 저장용

if (recognition) {
  recognition.lang = "ko-KR";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => (recognizing = true);

  recognition.onresult = (ev) => {
    let interim = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) finalBuf += (finalBuf ? " " : "") + r[0].transcript.trim();
      else interim += r[0].transcript;
    }
    lastInterim = interim;
    outEl.textContent = (finalBuf + " " + interim).trim();
    if (outEl.textContent) answerEl.classList.add("show-output");
  };

recognition.onend = async () => {
  recognizing = false;

  answerEl.classList.remove("is-recording");
  answerEl.classList.add("post-record");

  // ✅ 녹음 후엔 안내문 숨김 유지
  guideEl.style.opacity = 0;

  btnStart.disabled = false;
  btnStop.disabled = true;

     // 🪄 답변이 있으면 GPT 공감 생성
    if (finalBuf.trim()) {
      setTimeout(async () => {
        setCharacterState("empathy");
        const empathy = await generateEmpathy(finalBuf);
        await typeWriter(questionTextEl, empathy, empathy);
      }, 1500);
    }
  };

};


 

/***************************************
 * 🎧 음성 녹음/제어 버튼 이벤트 리스너
 ***************************************/

/**
 * @description 녹음 시작 버튼 클릭 시
 */
btnStart.addEventListener("click", () => {
  // recognition 객체가 없거나 이미 녹음 중이면 아무것도 하지 않음
  if (!recognition || recognizing) return;

  // 1. 캐릭터 상태를 '듣는 중'으로 변경
  setCharacterState("listening");

  // 2. 음성 인식 시작
  recognition.start();
  recognizing = true; // 녹음 상태 플래그 활성화

  // 3. UI 업데이트: 녹음 중 상태로 변경하고, 텍스트 출력 영역을 표시
  answerEl.classList.remove("post-record");
  answerEl.classList.add("is-recording", "show-output");

  // 4. 버튼 상태 변경: '시작' 비활성화, '중지' 활성화
  btnStart.disabled = true;
  btnStop.disabled = false;

  // 5. 가이드 메시지 숨기기
  guideEl.style.opacity = 0;
});


/**
 * @description 녹음 중지 버튼 클릭 시
 */
btnStop.addEventListener("click", () => {
  // recognition 객체가 없거나 녹음 중이 아닐 경우 아무것도 하지 않음
  if (!recognition || !recognizing) return;

  // 1. 음성 인식 중지 (종료 관련 UI 처리는 recognition.onend 이벤트에서 하는 것이 일반적)
  recognition.stop();

  // 2. 캐릭터 상태를 '대기'로 즉시 변경
  pauseCharacter();
});


/**
 * @description 처음부터 다시 말하기 버튼 클릭 시
 */
btnRestart.addEventListener("click", () => {
  // 1. 모든 텍스트 버퍼와 화면 출력 내용 초기화
  finalBuf = "";
  lastInterim = "";
  outEl.textContent = "";

  // 2. UI 상태 초기화: 모든 관련 CSS 클래스 제거
  answerEl.classList.remove("post-record", "is-recording", "show-output");

  // 3. 버튼 상태 초기화: '시작' 활성화, '중지' 비활성화
  btnStart.disabled = false;
  btnStop.disabled = true;

  // 4. (필요 시) 가이드 메시지를 다시 보여주기
  if (guideEl) {
    guideEl.style.opacity = 1;
  }
});

/*********************
 * 💬 GPT 공감문 생성
 *********************/
async function generateEmpathy(answerText) {
  // if (window.APP_MODE?.MOCK || !window.APP_MODE?.GPT) {
  //   console.log("💬 [MOCK GPT] 공감문 생성 생략:", answerText);
  //   const mockReplies = [
  //     "좋은 이야기네요!",
  //     "그 감정이 전해져요.",
  //     "참 따뜻한 기억이에요."
  //   ];
  //   return mockReplies[Math.floor(Math.random() * mockReplies.length)];
  // }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "너는 따뜻하고 공감력 있는 인터뷰어야. 아주 짧게 한두 문장으로 대답해." },
          { role: "user", content: `너는 따뜻하고 공감력 있는 인터뷰어야. 아주 짧게 한 문장(20자)으로 대답해.
존댓말을 사용하고, 평가·조언·설명은 하지 않는다. 감탄사 남용을 피한다.
출력은 텍스트 한 줄만 반환한다. 오류 시 "말씀 감사해요."를 반환한다.: ${answerText}` }
        ],
        temperature: 0.8
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "정말 좋은 이야기예요.";
  } catch (e) {
    console.error("GPT 공감 오류:", e);
    return "정말 좋은 이야기예요.";
  }
}

/*********************
 * 🔹 질문 렌더링 + 진행
 *********************/
let followupItems = [];
let currentQuestionIdx = 0;
const progressEl = document.createElement("div");
progressEl.id = "interview-progress";
document.querySelector(".nav").appendChild(progressEl);

async function loadFollowupQuestions(stageKey = "child") {
  // ✅ 1. 가장 최근 요약 키 찾기
  const latestKey = getLatestSummaryKey(stageKey);
  const summaryRaw = latestKey ? localStorage.getItem(latestKey) : null;

  if (!summaryRaw) {
    questionTextEl.textContent = "사건 요약이 없습니다.";
    console.warn("❌ 요약 데이터가 없습니다. summary_", stageKey, " 키를 찾을 수 없음.");
    return;
  }

  // ✅ 2. JSON 파싱 후 items 배열 추출
  const parsed = JSON.parse(summaryRaw);
  const items = Array.isArray(parsed.items) ? parsed.items : [];

  if (!items.length) {
    questionTextEl.textContent = "요약된 사건이 없습니다.";
    console.warn("⚠️ 요약 데이터는 있지만 items 배열이 비어 있습니다:", parsed);
    return;
  }

  // ✅ 3. 프롬프트 생성
  const prompt = items
    .map((it, i) => `${i + 1}. 제목: ${it.title}\n요약: ${it.summary25}`)
    .join("\n\n");

  // ✅ 4. GPT 호출 (실제 질문 생성)
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "너는 회상을 이끌어내는 한국어 인터뷰어다." },
          {
            role: "user",
            content: `아래의 사건 요약을 보고 각 사건에 대해 열린형 질문을 한 문장(20자)으로 만들어라.
존댓말을 사용하고, 평가·지시·추측 표현은 쓰지 않는다.
출력은 반드시 JSON 객체만 반환하라.

형식:
{ "byItem": [ { "title": "사건 이름", "question": "질문 문장" } ] }

사건 목록:
${prompt}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '{"byItem":[]}';
    const gptParsed = JSON.parse(raw);

    followupItems = gptParsed.byItem || [];
    console.log("🧩 followupItems 생성됨:", followupItems);
    renderQuestion();
  } catch (err) {
    console.error("❌ GPT 질문 생성 오류:", err);
    questionTextEl.textContent = "질문을 불러오는 중 오류가 발생했습니다.";
  }
}


/*********************
 * 🗣 질문 렌더링
 *********************/
function renderQuestion() {
  const cur = followupItems[currentQuestionIdx];
  if (!cur) return;

  // 🎞️ 캐릭터 상태 talking
  setCharacterState("talking");


if (currentQuestionIdx === 0) {
  btnPrev.classList.add("hidden");
} else {
  btnPrev.classList.remove("hidden");
}


  // 🎯 질문 및 진행률 갱신
  setTimeout(() => {
    questionTextEl.innerHTML = cur.question;
    progressEl.innerHTML = `<span class="current">${currentQuestionIdx + 1}</span>/<span class="total">${followupItems.length}</span>`;
    typeWriter(questionTextEl, cur.question, cur.question);
  }, 200);

  // ===========================
  // 🧹 [UI 초기화 구간 추가]
  // ===========================
  // 녹음 상태 리셋
  recognizing = false;
  finalBuf = "";
  lastInterim = "";
  outEl.textContent = "";

  // 안내문 & 버튼 복원
  guideEl.style.opacity = 1; // “아래 버튼을 클릭 후...” 보이기
  answerEl.classList.remove("post-record", "is-recording", "show-output");
  btnStart.disabled = false;
  btnStop.disabled = true;


  // 다음 버튼 텍스트
const nextTextEl = btnNext.querySelector(".btn-next-text");
if (nextTextEl) {
  if (currentQuestionIdx === followupItems.length - 1) {
    nextTextEl.textContent = "완료";
  } else {
    nextTextEl.textContent = "다음";
  }
}

  // ===========================
  // 👂 마이크 / 안내문 다시 표시
  // ===========================
  // "아래 버튼을 클릭 후..." 보이도록
  if (!answerEl.classList.contains("show-output")) {
    answerEl.classList.add("ready");
  }
}



/*********************
 * 🔘 다음 / 이전 버튼
 *********************/
btnNext.addEventListener("click", () => {
  answers[currentQuestionIdx] = outEl.textContent.trim();

  if (currentQuestionIdx < followupItems.length - 1) {
    // 🔹 아직 질문 남음 → 다음 질문
    currentQuestionIdx++;
    finalBuf = "";
    outEl.textContent = "";
    renderQuestion();
  } else {
    // 🔹 모든 질문이 끝났을 때
    console.log("✅ 모든 질문 완료됨");

    const params = new URLSearchParams(window.location.search);
    const stage = params.get("stage") || "child";

    const stageMap = {
      child: 2,
      teen: 2,
      adult: 3,
      middle: 3,
      senior: 4
    };
    const progressNum = stageMap[stage] || 2;

    // ✅ 상태 저장
    localStorage.setItem(`stageStatus_${progressNum}`, "completed");
    localStorage.setItem("roadmapProgress", String(progressNum));
    console.log(`🎯 ${progressNum}단계 완료 저장됨`);

    // ✅ 다음 이동 로직
    switch (stage) {
      case "child":
      case "teen":
        // 2단계 끝 → 로드맵으로
        window.location.href = "roadmap.html";
        break;

      case "adult":
        // 성인기 끝 → 중년기로
        window.location.href = "main-interview.html?stage=middle";
        break;

      case "middle":
        // 중년기 끝 → 로드맵으로 (3단계 완료)
        window.location.href = "roadmap.html";
        break;

      case "senior":
        // 노년기 끝 → 로드맵으로 (최종 종료)
        window.location.href = "roadmap.html";
        break;

      default:
        window.location.href = "roadmap.html";
        break;
    }
  }
});




btnPrev.addEventListener("click", () => {
  if (currentQuestionIdx > 0) {
    currentQuestionIdx--;

    // 🔹 이전 질문 내용 바로 표시 (TTS 없이)
    const cur = followupItems[currentQuestionIdx];
    questionTextEl.innerHTML = cur.question;
    progressEl.innerHTML = `<span class="current">${currentQuestionIdx + 1}</span>/<span class="total">${followupItems.length}</span>`;

    // 🔹 이전 답변 복원
    const savedAnswer = answers[currentQuestionIdx];
    if (savedAnswer) {
      outEl.textContent = savedAnswer;
      answerEl.classList.add("post-record", "show-output");
      btnRestart.style.display = "flex"; // 재시작 버튼 표시
      guideEl.style.opacity = 0; // ✅ 가이드 텍스트 숨김
    } else {
      outEl.textContent = "";
      answerEl.classList.remove("show-output", "post-record");
      btnRestart.style.display = "none";
      guideEl.style.opacity = 1; // ✅ 답변 없을 때만 다시 표시
    }

    // 🔹 캐릭터는 대기 상태로
    pauseCharacter();

    // 🔹 이전 버튼 표시 제어
    if (currentQuestionIdx === 0) {
      btnPrev.classList.add("hide");
    } else {
      btnPrev.classList.remove("hide");
    }

    // 🔹 다음 버튼 텍스트 복원
    btnNext.textContent =
      currentQuestionIdx === followupItems.length - 1 ? "완료" : "다음";
  }
});

