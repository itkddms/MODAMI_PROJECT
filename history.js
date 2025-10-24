document.addEventListener('DOMContentLoaded', () => {
  // 🔑 시기별 데이터
  const stagesByPeriod = {
    "CHILD": {
      title: "유아기 (0-12세)",
      text: "BGM - 노란 샤쓰의 사나이 (1961) / 한명숙",
      audioSrc: "sound/1961.mp3",
      backgroundClass: "history_child_bg"
    },
    "TEEN": {
      title: "청소년기 (13-19세)",
      text: "BGM - 아침이슬 (1971) / 양희은",
      audioSrc: "sound/1971.mp3",
      backgroundClass: "history_teen_bg"
    },
    "ADULT": {
      title: "성인기 (20-39세)",
      text: "BGM - 가로수 그늘 아래 서면 (1988) / 이문세",
      audioSrc: "sound/1988.mp3",
      backgroundClass: "history_adult_bg"
    },
    "MIDDLE": {
      title: "중년기 (40-64세)",
      text: "BGM - 거짓말 (2000) / GOD",
      audioSrc: "sound/2000.mp3",
      backgroundClass: "history_middle_bg"
    },
    "SENIOR": {
      title: "노년기 (65세 이상)",
      text: "BGM - 테스형! (2020) / 나훈아",
      audioSrc: "sound/2020.mp3",
      backgroundClass: "history_senior_bg"
    }
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
  const pageTitleEl = document.getElementById("page-title"); // ✅ nav 제목 요소

  let currentIndex = 0;

  // 🎵 시기 재생 함수
  function playStage(periodKey) {
    const stage = stagesByPeriod[periodKey];
    if (!stage) return;

    // ✅ nav 제목 업데이트
    pageTitleEl.textContent = stage.title;

    // ✅ 텍스트 및 오디오 설정
    narrationText.textContent = stage.text;
    narrationAudio.src = stage.audioSrc;

    // ✅ 배경 전환
    backgroundContainer.className = '';
    backgroundContainer.classList.add(stage.backgroundClass);

    // ✅ 자동재생 시도
    narrationAudio.play().catch(e => console.warn("자동재생 차단:", e));
  }

  // ✅ 다음 시기로 이동
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
  narrationAudio.addEventListener("ended", goNextStage);

  // 🎛️ 버튼 눌러도 다음 시기로
  nextBtn?.addEventListener("click", goNextStage);

  // ✅ 첫 시기부터 시작
  playStage(sequence[currentIndex]);
});
