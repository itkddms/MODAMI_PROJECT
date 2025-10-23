/******************************************************
 * ✅ index.js (최종 안정 버전)
 ******************************************************/

// index.html의 '시작하기' 버튼 클릭 시 실행
function saveStartData() {
  localStorage.setItem('isStarted', 'true');
  localStorage.setItem('userName', '김모담');
  console.log('데이터가 로컬스토리지에 저장되었습니다!');
}

/******************************************************
 * roadmap.html 페이지 로드 시
 ******************************************************/
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('roadmap.html')) {
    const hasStarted = localStorage.getItem('isStarted');
    const userName = localStorage.getItem('userName');
    if (hasStarted === 'true') {
      console.log('시작하기를 통해 roadmap.html에 접속했습니다.');
      // h1 등 콘텐츠 변경 로직 추가 가능
    }
  }

  // ✅ API 키 자동 체크 — 없을 때만 모달 표시
  const gptKey = localStorage.getItem("OPENAI_API_KEY");
  const ttsKey = localStorage.getItem("GOOGLE_TTS_KEY");
  if (!gptKey || !ttsKey) {
    showApiKeyModal(); // 하나라도 없으면 모달 표시
  } else {
    console.log("✅ 이미 API 키가 설정되어 있습니다.");
  }
});

/******************************************************
 * 전체 초기화
 ******************************************************/
function resetModamiData() {
  const removeTargets = [
    "roadmapProgress",
    "selectedStage",
    "autostartNarration",
    "OPENAI_API_KEY", // 전체 초기화 시 포함
    "GOOGLE_TTS_KEY",
  ];

  Object.keys(localStorage).forEach(key => {
    if (
      key.startsWith("interview_") ||
      key.startsWith("summary_") ||
      key.startsWith("stageStatus_") ||
      removeTargets.includes(key)
    ) {
      localStorage.removeItem(key);
    }
  });

  alert("모든 데이터가 초기화되었습니다. (API 키 포함)");
  window.location.href = "index.html"; // 첫 화면으로 이동
}

/******************************************************
 * API 키 다시 입력 (선택형 초기화)
 ******************************************************/
function resetApiKeyOnly() {
  localStorage.removeItem("OPENAI_API_KEY");
  localStorage.removeItem("GOOGLE_TTS_KEY");
  alert("API 키가 초기화되었습니다. 다시 입력해주세요.");
  showApiKeyModal();
}

/******************************************************
 * 모달 표시 함수
 ******************************************************/
function showApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  if (modal) {
    modal.style.display = 'flex';
  } else {
    console.warn("⚠️ apiKeyModal 요소를 찾을 수 없습니다.");
  }
}

function hideApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

document.getElementById("closeModalBtn").addEventListener("click", () => {
  hideApiKeyModal();
});



/******************************************************
 * 이벤트 바인딩
 ******************************************************/
document.getElementById("btn-reset").addEventListener("click", () => {
  if (confirm("정말 모든 데이터를 삭제하고 처음부터 다시 시작하시겠습니까?")) {
    resetModamiData();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "R") {
    resetModamiData();
  }
});

const reenterBtn = document.getElementById("btn-reenter-api");
if (reenterBtn) {
  reenterBtn.addEventListener("click", () => {
    resetApiKeyOnly(); // ✅ “API 키 다시 입력하기” 버튼 클릭 시 동작
  });
}

document.getElementById("saveKeysBtn").addEventListener("click", () => {
  const gptKey = document.getElementById("gptKeyInput").value.trim();
  const ttsKey = document.getElementById("ttsKeyInput").value.trim();

  if (!gptKey || !ttsKey) {
    alert("두 키를 모두 입력해주세요!");
    return;
  }

  localStorage.setItem("OPENAI_API_KEY", gptKey);
  localStorage.setItem("GOOGLE_TTS_KEY", ttsKey);
  alert("✅ API 키가 저장되었습니다.");
  hideApiKeyModal();
});
