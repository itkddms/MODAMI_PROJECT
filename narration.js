const characterEl = document.getElementById("character-video");
let audioUnlocked = false;

// 🔽 [추가] 이미지 미리 로드
const talkingGif = new Image();
talkingGif.src = "gif/talking02.gif";
const waitingGif = new Image();
waitingGif.src = "gif/waiting02.gif";
// 🔼 [추가] 여기까지


/*******************************
 * narration.js (완전 안정 + 자동 첫 TTS)
 *******************************/
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🎬 narration.js 시작");

    // 🔹 뒤로가기 버튼 클릭 시 loadmap.html로 이동
  const btnBack = document.getElementById("btn-back");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      window.location.href = "roadmap.html";
    });
  }


  // ✅ 오디오 정책 우회 (Chrome autoplay 방지용)
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  document.body.addEventListener("click", () => ctx.resume());
  try {
    await ctx.resume();
    console.log("🔓 오디오 재생 허용됨");
  } catch (e) {
    console.warn("⚠️ AudioContext resume 실패:", e);
  }

  let currentAudio = null;
  let currentTextIndex = 0;
  let typingInterval = null;
  let autoAdvanceTimer = null; // 🔽 [추가] 5초 자동 넘김 타이머

  const nextBtn = document.querySelector(".nextbtn");
  const skipBtn = document.querySelector(".skipbtn");
  const gender = localStorage.getItem("selectedGender") || "할머니";

  /*******************************
   * 🔹 단계별 대사 템플릿
   *******************************/
  const params = new URLSearchParams(window.location.search);
  const step = parseInt(params.get("step")) || 1;
  console.log("📘 현재 step =", step);

  const templatesByStep = {
    1: [
      { displayText: `${gender} 저는 AI 손녀 '담이'에요! 만나서 반가워요.`, tts: `${gender} 저는 에이아이 손녀 담이예요! 만나서 반가워요.` },
      { displayText: `오늘부터 저와 총 5번의 단계를 통해 ${gender}의 <br> 이야기를 담은 자서전을 만들어 볼 거예요.`, tts: `오늘부터 저와 총 다섯 번의 단계를 통해 ${gender}의 이야기를 담은 자서전을 만들어볼 거예요.` },
      { displayText: `기억들을 회고하기 전에 담이가 ${gender}의 <br>유아기, 청소년기 시절의 사진과 노래를 들려드릴게요.`, tts: `기억들을 회고하기 전에 담이가 ${gender}의 유아기와 청소년기 시절의 사진과 노래를 들려드릴게요.`, next: "history.html?group=childteen&returnStep=2" }
    ],
    2: [
      { displayText: `${gender}의 유아기와 청소년기 이야기가 너무 궁금해요!<br> 저에게 들려주시겠어요?`, tts: `${gender}의 유아기와 청소년기 이야기가 너무 궁금해요! 저에게 들려주시겠어요?`, next: "pre-interview.html?stage=child&returnStep=3" }
    ],
    3: [
      { displayText: `이전 이야기들 잘 들었어요! 이제 다음 단계로 넘어갈까요?`, tts: `이전 이야기들 잘 들었어요! 이제 다음 단계로 넘어갈까요?` },
      { displayText: `기억들을 회고하기 전에 담이가 ${gender}의 <br> 성인기, 중년기 시절의 사진과 노래를 들려드릴게요.`, tts: `기억들을 회고하기 전에 담이가 ${gender}의 성인기와 중년기 시절의 사진과 노래를 들려드릴게요.`, next: "history.html?group=adultmiddle&returnStep=4" }
    ],
    4: [
      { displayText: `${gender}의 성인기와 중년기 이야기가 너무 궁금해요! <br> 저에게 들려주시겠어요?`, tts: `${gender}의 성인기와 중년기 이야기가 너무 궁금해요! 저에게 들려주시겠어요?`, next: "pre-interview.html?stage=adult&returnStep=5" }
    ],
    5: [
      { displayText: `정말 감동적인 이야기였어요. 이제 마지막 단계예요!`, tts: `정말 감동적인 이야기였어요. 이제 마지막 단계예요!` },
      { displayText: `기억들을 회고하기 전에 담이가 ${gender}의 노년기 시절의 사진과 노래를 보여드릴게요.`, tts: `기억들을 회고하기 전에 담이가 ${gender}의 노년기 시절의 사진과 노래를 보여드릴게요.`, next: "history.html?group=senior&returnStep=6" }
    ],
    6: [
      { displayText: `${gender}의 노년기 이야기가 너무 궁금해요! <br> 저에게 들려주시겠어요?`, tts: `${gender}의 노년기 이야기가 너무 궁금해요! 저에게 들려주시겠어요?`, next: "pre-interview.html?stage=senior&returnStep=7" }
    ],
    7: [
      { displayText: `오늘 이야기 정말 잘 들었어요.<br> 이제 마무리할 시간이네요.`, tts: `오늘 이야기 정말 잘 들었어요. 이제 마무리할 시간이네요.` },
      { displayText: `소중한 이야기 들려주셔서 감사드리고, <br> 다음 단계에서 다시 뵐게요. 고생하셨습니다!`, tts: `소중한 이야기 들려주셔서 감사드리고, 다음 단계에서 다시 뵐게요. 고생하셨습니다!`, next: "roadmap.html" }
    ]
  };

  const textTemplates = templatesByStep[step];
  const texts = [];

  textTemplates.forEach((t, i) => {
    const el = document.getElementById(`text${i + 1}`);
    if (el) {
      el.innerHTML = "";
      el.style.display = "none";
      texts.push(el);
    }
  });

  /*******************************
   * 🎙️ TTS 함수
   *******************************/
async function getTtsAudio(textScript) {
  if (!textScript) return null;

  // ✅ HTML 태그 제거 (깨끗한 텍스트만 TTS에 전달)
  textScript = textScript.replace(/<[^>]*>/g, " ").trim();

  // ✅ localStorage에 저장된 키 가져오기
  const TTS_API_KEY = localStorage.getItem("TTS_KEY");
  if (!TTS_API_KEY) {
    alert("⚠️ TTS API 키가 없습니다. 첫 화면에서 입력해주세요.");
    throw new Error("Missing TTS API key");
  }

  try {
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${TTS_API_KEY}`;

    const payload = {
      input: { text: textScript },
      voice: { languageCode: "ko-KR", name: "ko-KR-Neural2-A" },
      audioConfig: { audioEncoding: "MP3", speakingRate: 1.0 }
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.audioContent) {
      console.error("❌ audioContent 없음:", data.error || data);
      return null;
    }

    // ✅ 오디오 생성 및 반환
    const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
    const audio = new Audio(audioUrl);

    return { audio };
  } catch (e) {
    console.error("TTS 오류:", e);
    return null;
  }
}

/*******************************
   * ✏️ 타닥 효과 + 오디오 동기화 (TTS 연동형)
   *******************************/
  async function typeWriter(el, text, ttsScript) {
    if (!el || !text) return;

    el.style.display = "block";
    el.innerHTML = "";

    // 🔸 TTS 오디오 미리 가져오기
    const audioData = await getTtsAudio(ttsScript);
    
    // 🔽 [수정] 오디오 실패 시 로직 명확화 및 currentAudio 할당
    if (!audioData?.audio) {
      // 🔸 오디오 실패 시: 단순 타닥 효과만 (이 부분은 기존과 동일)
      const interval = setInterval(() => {
        el.innerHTML = text.slice(0, idx);
        idx++;
        if (idx > text.length) clearInterval(interval);
      }, 30);
      return; // 오디오가 없으므로 종료
    }

    // ✅ [수정] 전역 변수에 현재 오디오 할당
    currentAudio = audioData.audio;
    const audio = currentAudio; // 로컬 변수로도 사용
    // 🔼 [수정] 여기까지

    const pureText = text.replace(/<br>/g, "\n").replace(/<[^>]*>/g, "").trim();
    const totalChars = pureText.length;
    let typed = 0;
    let idx = 0;

    // 🎞️ 캐릭터 상태 제어
    audio.addEventListener("play", () => {
      if (characterEl) {
        characterEl.src = `gif/talking02.gif`;
        characterEl.style.opacity = "1";
      }
    });

    // 🔽 [수정] audio 'ended' 이벤트 리스너
    audio.addEventListener("ended", () => {
      if (characterEl) {
        characterEl.src = `gif/waiting02.gif`;
        characterEl.style.opacity = "1";
      }

      // ✅ [추가] 5초 후 다음 나레이션 자동 실행
      console.log(`🔊 나레이션(${currentTextIndex}) 종료. 3초 후 자동 진행...`);
      
      // 혹시 모를 이전 타이머 클리어
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
      
      autoAdvanceTimer = setTimeout(() => {
        advanceToNextNarration();
      }, 3000); // 3초 대기
    });
    // 🔼 [수정] 여기까지


    // 🎧 실제 재생
    audio.play().catch(e => console.error("TTS 재생 실패:", e));

    // 🕒 오디오 진행에 맞춰 글자 표시
    // ... (이하 typingInterval 로직은 기존과 동일) ...
    const duration = audio.duration || 3;
    const startTime = performance.now();

    typingInterval = setInterval(() => {
      const elapsed = audio.currentTime || ((performance.now() - startTime) / 1000);
      const progress = elapsed / duration;
      const targetChars = Math.floor(totalChars * progress);

      while (typed < targetChars && idx < text.length) {
        const char = text[idx];
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

      if (audio.ended || idx >= text.length) {
        clearInterval(typingInterval);
        el.innerHTML = text;
      }
    }, 25);
  }


/*******************************
   * ▶️ 텍스트 재생 함수
   *******************************/
  async function playText(idx) {
    const el = texts[idx];
    const t = textTemplates[idx];
    if (!el || !t) return;
    await typeWriter(el, t.displayText, t.tts);
  }

  // 🔽 [추가] 다음 나레이션/페이지로 이동하는 공통 함수
  function advanceToNextNarration() {
    // 1. 현재 진행 중인 모든 동작 중지
    if (typingInterval) clearInterval(typingInterval);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = ""; // 리소스 해제
      currentAudio = null;
    }
    // 2. 예약된 자동 넘김이 있었다면 취소
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }

    const currentTemplate = textTemplates[currentTextIndex];

    // 3. 다음 페이지로 이동해야 하는지 확인
    if (currentTemplate?.next) {
      console.log(`🚀 다음 페이지로 이동: ${currentTemplate.next}`);
      window.location.href = currentTemplate.next;
      return;
    }

    // 4. 다음 나레이션으로 이동 (현재 페이지)
    if (texts[currentTextIndex]) {
      texts[currentTextIndex].style.display = "none";
    }
    
    currentTextIndex++;
    
    if (currentTextIndex < texts.length) {
      console.log(`▶️ 다음 나레이션(${currentTextIndex}) 자동 재생`);
      playText(currentTextIndex);
    } else {
      console.log("🏁 모든 나레이션 완료.");
    }
  }

/*******************************
   * ⏭️ 버튼
   *******************************/
  // 🔽 [수정] nextBtn 이벤트 리스너
  nextBtn.addEventListener("click", () => {
    console.log("🖱️ nextBtn 클릭. 즉시 다음으로 진행.");
    advanceToNextNarration(); // 공통 함수 호출
  });
  // 🔼 [수정] 여기까지

  // 🔽 [수정] skipBtn 이벤트 리스너
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      // ✅ [추가] 자동 넘김 타이머 취소
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
      
      // 오디오 및 타이핑 중단
      if (currentAudio) {
          currentAudio.pause();
          currentAudio.src = "";
          currentAudio = null;
      }
      if (typingInterval) clearInterval(typingInterval);

      // 현재 단계(step)에 해당하는 next 링크 탐색
      const currentTemplates = templatesByStep[step];
      const lastTemplate = currentTemplates[currentTemplates.length - 1];

      if (lastTemplate?.next) {
        // next 경로가 있으면 바로 이동
        window.location.href = lastTemplate.next;
      } else {
        // next 경로가 없는 단계라면 현재 텍스트만 즉시 완성
        texts[currentTextIndex].innerHTML = textTemplates[currentTextIndex].displayText;
        // (이 경우엔 멈추는 것이므로 추가 동작 없음)
      }
    });
  }

  /*******************************
   * 🚀 첫 문장 자동 실행
   *******************************/
  await playText(currentTextIndex);
});
