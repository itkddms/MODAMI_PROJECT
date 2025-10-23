// key.js — OpenAI + Google TTS API 키 관리
const modal = document.getElementById("apiModal");
const saveBtn = document.getElementById("saveKeysBtn");
const gptInput = document.getElementById("gptKeyInput");
const ttsInput = document.getElementById("ttsKeyInput");

saveBtn.onclick = () => {
  const gptKey = gptInput.value.trim();
  const ttsKey = ttsInput.value.trim();

  if (!gptKey.startsWith("sk-")) {
    alert("⚠️ 올바른 OpenAI GPT 키를 입력해주세요 (sk-로 시작).");
    return;
  }
  if (!ttsKey.startsWith("AIza")) {
    alert("⚠️ 올바른 Google TTS 키를 입력해주세요 (AIza-로 시작).");
    return;
  }

  // 브라우저 저장소에 키 저장
  localStorage.setItem("GPT_KEY", gptKey);
  localStorage.setItem("TTS_KEY", ttsKey);

  alert("✅ 키가 저장되었습니다!");
  modal.style.display = "none";
};

// 페이지 로드 시 이미 저장된 키 확인
window.addEventListener("DOMContentLoaded", () => {
  const gpt = localStorage.getItem("GPT_KEY");
  const tts = localStorage.getItem("TTS_KEY");
  if (gpt && tts) {
    modal.style.display = "none"; // 키 둘 다 있으면 모달 숨김
  }
});
