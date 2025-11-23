/******************************************************
 * ✅ index.js (유연 저장 버전)
 ******************************************************/

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

  // ✅ API 키 자동 체크 — 둘 다 없을 때만 모달 표시
  const gptKey = localStorage.getItem("OPENAI_API_KEY");
  const ttsKey = localStorage.getItem("GOOGLE_TTS_KEY");
  if (!gptKey && !ttsKey) {
    showApiKeyModal();
  } else {
    console.log("✅ 최소 1개 이상의 키가 설정되어 있습니다.");
  }

  // ✅ 입력 중 자동 임시 저장(선택) — 존재할 때만 바인딩
  const gptInput = document.getElementById("gptKeyInput");
  const ttsInput = document.getElementById("ttsKeyInput");
  if (gptInput) {
    gptInput.value = gptKey || "";
    gptInput.addEventListener("input", (e) => {
      // 빈 값도 저장 허용(요청사항)
      localStorage.setItem("OPENAI_API_KEY", e.target.value);
    });
  }
  if (ttsInput) {
    ttsInput.value = ttsKey || "";
    ttsInput.addEventListener("input", (e) => {
      localStorage.setItem("GOOGLE_TTS_KEY", e.target.value);
    });
  }

  // 버튼/핫키 바인딩(안전)
  const resetBtn = document.getElementById("btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("정말 모든 데이터를 삭제하고 처음부터 다시 시작하시겠습니까?")) {
        resetModamiData();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "R") {
      resetModamiData();
    }
  });

  const reenterBtn = document.getElementById("btn-reenter-api");
  if (reenterBtn) {
    reenterBtn.addEventListener("click", () => {
      resetApiKeyOnly();
    });
  }

  const closeBtn = document.getElementById("closeModalBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => hideApiKeyModal());
  }

  const saveBtn = document.getElementById("saveKeysBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      // ✅ 둘 다 비어도 저장/진행 가능 — 입력된 것만 개별 반영
      const gptVal = (document.getElementById("gptKeyInput")?.value ?? "").trim();
      const ttsVal = (document.getElementById("ttsKeyInput")?.value ?? "").trim();

      // 빈 값도 그대로 저장(요청사항: “없어도 저장”)
      localStorage.setItem("OPENAI_API_KEY", gptVal);
      localStorage.setItem("GOOGLE_TTS_KEY", ttsVal);

      alert("✅ 입력하신 값으로 저장했습니다. (빈 값도 저장됨)");
      hideApiKeyModal();
    });
  }

  // ✅ “건너뛰기” 버튼이 있다면 지원(선택)
  const skipBtn = document.getElementById("skipKeysBtn");
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      // 저장 없이 그냥 닫기
      hideApiKeyModal();
    });
  }
});

/******************************************************
 * 전체 초기화
 ******************************************************/
function resetModamiData() {
  // 🔹 남겨둘 키들(= API 키들)
  const keepKeys = new Set([
    "OPENAI_API_KEY",
    "GOOGLE_TTS_KEY",
    "GPT_KEY",
    "TTS_KEY"
  ]);

  // 🔹 localStorage 전체 순회하면서, 보존 키를 제외하고 전부 삭제
  Object.keys(localStorage).forEach((key) => {
    if (!keepKeys.has(key)) {
      localStorage.removeItem(key);
    }
  });

  alert("API 키를 제외한 모든 데이터가 초기화되었습니다.");
  window.location.href = "index.html";
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
 * 모달 표시/숨김
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
