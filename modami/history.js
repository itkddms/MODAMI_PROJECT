document.addEventListener('DOMContentLoaded', () => {
  // 🔑 시기별 데이터
  const stagesByPeriod = {
    "CHILD": { text: "BGM - 가거라 삼팔선 (1948) / 남인수", audioSrc: "/sound/1940.mp3", backgroundClass: "history_child_bg" },
    "TEEN": { text: "BGM - 굳세어라 금순아 (1953) / 현인", audioSrc: "/sound/1950.mp4", backgroundClass: "history_teen_bg" },
    "ADULT": { text: "BGM - 노란 샤쓰의 사나이 (1961) / 한명숙", audioSrc: "/sound/1960.mp4", backgroundClass: "history_adult_bg" },
    "MIDDLE": { text: "BGM - 서울 서울 서울 (1988) / 조용필", audioSrc: "/sound/1988.mp3", backgroundClass: "history_middle_bg" },
    "SENIOR": { text: "BGM - 바람의 노래 (2002) / 조용필", audioSrc: "/sound/2002.mp3", backgroundClass: "history_senior_bg" }
  };

  // 🔑 narration에서 넘어올 때 ?group=childteen&returnStep=1
  const urlParams = new URLSearchParams(window.location.search);
  const group = urlParams.get("group") || "childteen"; 
  const returnStep = urlParams.get("returnStep") || "1"; 

  // 🔑 group별 시기 묶음 정의
  const groups = {
    "childteen": ["CHILD", "TEEN"],
    "adultmiddle": ["ADULT", "MIDDLE"],
    "senior": ["SENIOR"]
  };

  const sequence = groups[group];
  if (!sequence) return;

  const narrationText = document.getElementById("narrationText");
  const narrationAudio = document.getElementById("narrationAudio");
  const backgroundContainer = document.getElementById("backgroundContainer");
  const nextBtn = document.querySelector(".nextbtn");

  let currentIndex = 0;

  function playStage(periodKey) {
    const stage = stagesByPeriod[periodKey];
    if (!stage) return;

    narrationText.textContent = stage.text;
    narrationAudio.src = stage.audioSrc;
    backgroundContainer.className = '';
    backgroundContainer.classList.add(stage.backgroundClass);

    narrationAudio.play().catch(e => console.warn("자동재생 차단:", e));
  }

  // ✅ 다음으로 진행
  function goNextStage() {
    narrationAudio.pause();
    currentIndex++;

    if (currentIndex < sequence.length) {
      playStage(sequence[currentIndex]);
    } else {
      // ✅ 모든 시기 끝 → 나레이션으로 복귀
      sessionStorage.setItem("force_text_start", "text4");
      window.location.href = `narration.html?step=${returnStep}&start=text4`;
    }
  }

  // 🎧 음악이 끝나면 자동 다음 시기
  narrationAudio.addEventListener("ended", () => {
    goNextStage();
  });

  // 🎛️ 버튼 눌러도 다음 시기로
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      goNextStage();
    });
  }

  // ✅ 첫 시기부터 시작
  playStage(sequence[currentIndex]);
});


