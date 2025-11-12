document.addEventListener('DOMContentLoaded', async () => {

  try {
  const response = await fetch("data\assets_5year.json");
  console.log("📦 fetch 결과 상태:", response.status);
  const text = await response.text();
  console.log("📦 JSON 원본:", text.slice(0, 100)); // 앞부분만 출력
  const assets = JSON.parse(text);
  console.log("✅ JSON 파싱 성공:", assets);
} catch (err) {
  console.error("❌ JSON 불러오기 오류:", err);
}


  /**********************************************
   * 1️⃣ 출생연도 기반으로 동적 시기 데이터 구성
   **********************************************/
  const birthYear = Number(localStorage.getItem("birthYear")) || 1955;
  const currentYear = 2025;

  // JSON 파일로 관리하는 5년 단위 자산 불러오기
  const response = await fetch("data/assets_5year.json");
  const assets = await response.json();

  const get5YearPeriod = (year) => {
    const base = Math.floor((year - 1950) / 5) * 5 + 1950;
    return String(base);
  };

  const stages = {
    child: { start: birthYear, end: birthYear + 12 },
    teen: { start: birthYear + 13, end: birthYear + 19 },
    adult: { start: birthYear + 20, end: birthYear + 39 },
    middle: { start: birthYear + 40, end: birthYear + 64 },
    senior: { start: birthYear + 65, end: currentYear }
  };

  const stageData = Object.entries(stages).reduce((acc, [key, { start, end }]) => {
    const avgYear = Math.round((start + end) / 2);
    const key5 = get5YearPeriod(avgYear);
    acc[key.toUpperCase()] = assets[key5] || assets["2020"];
    return acc;
  }, {});

  // 🔹 기존 구조 유지 (title은 고정, text/audioSrc만 동적 교체)
  const stagesByPeriod = {
    "CHILD": {
      title: "유아기 (0-12세)",
      text: stageData.CHILD.text,
      audioSrc: stageData.CHILD.music,
      backgroundClass: "history_child_bg"
    },
    "TEEN": {
      title: "청소년기 (13-19세)",
      text: stageData.TEEN.text,
      audioSrc: stageData.TEEN.music,
      backgroundClass: "history_teen_bg"
    },
    "ADULT": {
      title: "성인기 (20-39세)",
      text: stageData.ADULT.text,
      audioSrc: stageData.ADULT.music,
      backgroundClass: "history_adult_bg"
    },
    "MIDDLE": {
      title: "중년기 (40-64세)",
      text: stageData.MIDDLE.text,
      audioSrc: stageData.MIDDLE.music,
      backgroundClass: "history_middle_bg"
    },
    "SENIOR": {
      title: "노년기 (65세 이상)",
      text: stageData.SENIOR.text,
      audioSrc: stageData.SENIOR.music,
      backgroundClass: "history_senior_bg"
    }
  };

  /**********************************************
   * 2️⃣ 아래는 기존 로직 그대로 유지
   **********************************************/
  const urlParams = new URLSearchParams(window.location.search);
  const group = urlParams.get("group") || "childteen";
  const returnStep = urlParams.get("returnStep") || "1";

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
  const pageTitleEl = document.getElementById("page-title");

  let currentIndex = 0;

  function playStage(periodKey) {
    const stage = stagesByPeriod[periodKey];
    if (!stage) return;

    pageTitleEl.textContent = stage.title;
    narrationText.textContent = stage.text;
    narrationAudio.src = stage.audioSrc;

    backgroundContainer.className = '';
    backgroundContainer.classList.add(stage.backgroundClass);

    narrationAudio.play().catch(e => console.warn("자동재생 차단:", e));
  }

  function goNextStage() {
    narrationAudio.pause();
    currentIndex++;

    if (currentIndex < sequence.length) {
      playStage(sequence[currentIndex]);
    } else {
      sessionStorage.setItem("force_text_start", "text4");
      window.location.href = `narration.html?step=${returnStep}&start=text4`;
    }
  }

  narrationAudio.addEventListener("ended", goNextStage);
  nextBtn?.addEventListener("click", goNextStage);

  // ✅ 시작
  playStage(sequence[currentIndex]);
});
