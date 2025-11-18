// autobio-print.js

// 👉 기존 autobiography.js의 buildPagedSpreads 함수를 그대로 복붙해도 되고,
// 공통 파일로 빼도 돼. 여기서는 간단화를 위해 핵심 부분만 가져온 버전.

function buildPagedSpreads(questions) {
  const spreads = [];
  const measureBox = document.createElement("div");
  document.body.appendChild(measureBox);

  Object.assign(measureBox.style, {
    position: "absolute",
    left: "-9999px",
    top: "-9999px",
    width: "470px",
    fontSize: "16px",
    lineHeight: "1.8",
    fontFamily: "'Kim jung chul Myungjo', serif",
    whiteSpace: "pre-wrap",
    padding: "0",
    border: "none",
    textAlign: "justify",
  });

  const maxHeightLeft = 500;
  const maxHeightRight = 500;

  let currentPage = { left: "", right: "", leftMeta: null, rightMeta: null };
  let pageSide = "left";

  for (const q of questions) {
    let remainingText = q.answer.replace(/\s*\n\s*/g, " ").trim();
    let isFirstPageOfQuestion = true;

    while (remainingText.length > 0) {
      let headerHeight = 0;
      if (isFirstPageOfQuestion) {
        const tempHeader = document.createElement("div");
        tempHeader.className = "content-label";
        tempHeader.innerHTML = `<p>${q.stage}</p><h1>${q.question}</h1>`;
        measureBox.appendChild(tempHeader);
        headerHeight = tempHeader.offsetHeight;
        measureBox.innerHTML = "";
      }

      const limit = (pageSide === "left" ? maxHeightLeft : maxHeightRight) - headerHeight;

      const words = remainingText.split(" ");
      let textForThisPage = "";
      let tempText = "";

      for (let i = 0; i < words.length; i++) {
        tempText += (i > 0 ? " " : "") + words[i];
        measureBox.textContent = tempText;

        if (measureBox.scrollHeight > limit) break;
        textForThisPage = tempText;
      }

      remainingText = remainingText.slice(textForThisPage.length).trim();

      if (pageSide === "left") {
        currentPage.left = textForThisPage;
        if (isFirstPageOfQuestion) {
          currentPage.leftMeta = { stage: q.stage, question: q.question };
        }
        pageSide = "right";
      } else {
        currentPage.right = textForThisPage;
        if (isFirstPageOfQuestion) {
          currentPage.rightMeta = { stage: q.stage, question: q.question };
        }
        spreads.push(currentPage);
        currentPage = { left: "", right: "", leftMeta: null, rightMeta: null };
        pageSide = "left";
      }

      isFirstPageOfQuestion = false;
    }
  }

  if (currentPage.left || currentPage.right) {
    spreads.push(currentPage);
  }

  document.body.removeChild(measureBox);
  return spreads;
}

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("print-container");
  const titleEl = document.getElementById("print-title");
  const dateEl = document.getElementById("print-date");

  // 1️⃣ 제목/날짜 복원
  const savedTitle = localStorage.getItem("autobiographyTitle") || "나의 찬란했던 인생";
  titleEl.textContent = savedTitle;

  const today = new Date();
  const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}`;
  dateEl.textContent = formattedDate;

  // 2️⃣ 인터뷰 기반 자서전 데이터 가져오기
  const raw = localStorage.getItem("autobio_interviewData");
  if (!raw) {
    container.innerHTML = "<p>자서전 데이터가 없습니다. 이전 페이지에서 먼저 생성해 주세요.</p>";
    return;
  }

  const interviewData = JSON.parse(raw);
  const spreads = buildPagedSpreads(interviewData);

  // 3️⃣ 모든 spread를 한 번에 렌더링
  let html = "";
  spreads.forEach((s) => {
    const leftHeader = s.leftMeta
      ? `<div class="content-label">
           <p>${s.leftMeta.stage}</p>
           <h1>${s.leftMeta.question}</h1>
         </div>`
      : "";

    const rightHeader = s.rightMeta
      ? `<div class="content-label">
           <p>${s.rightMeta.stage}</p>
           <h1>${s.rightMeta.question}</h1>
         </div>`
      : "";

    html += `
      <div class="spread-wrapper">
        <div class="page page-left">
          ${leftHeader}
          <div class="story-text">${s.left}</div>
          <div class="bottom-line"></div>
        </div>
        <div class="page page-right">
          ${rightHeader}
          <div class="story-text">${s.right}</div>
          <div class="bottom-line"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // 4️⃣ DOM이 다 그려진 뒤 자동으로 인쇄창 열기
  setTimeout(() => {
    window.print();
    // 인쇄 끝나고 탭 자동 닫고 싶다면:
    // window.close();
  }, 200);
});
