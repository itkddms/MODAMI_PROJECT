/*******************************************************
 * autobiography.js — 문자 단위 overflow 감지 (완전 교정 버전)
 *******************************************************/
// ✅ 수정
let OPENAI_API_KEY = "";

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ 모달에서 입력한 키 불러오기
  OPENAI_API_KEY = localStorage.getItem("GPT_KEY") || "";

  if (!OPENAI_API_KEY) {
    alert("⚠️ OpenAI API 키가 설정되어 있지 않습니다. 첫 화면에서 입력해주세요.");
    // 모달 페이지로 리다이렉트하거나 안내 메시지 띄워도 됨
    return;
  }
});
// ✅ 모담이 인터뷰 데이터 로드 테스트
(function testLoadInterviews() {
  const stageMap = {
    child: "유아기",
    teen: "청소년기",
    adult: "성인기",
    middle: "중년기",
    senior: "노년기"
  };

  const results = [];

  for (const [prefix, stageName] of Object.entries(stageMap)) {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`interview_${prefix}_`));
    if (!keys.length) continue;

    console.group(`📘 ${stageName} (${prefix}) — ${keys.length}개`);
    keys.sort();

    for (const key of keys) {
      try {
        const item = JSON.parse(localStorage.getItem(key));

        if (item && item.content && item.title && !item.title.includes("사전인터뷰")) {
        console.log({
          key,
          stage: stageName,
          title: item?.title,
          content: item?.content?.slice(0, 80) + "..." // 내용 일부만 미리보기
        });
        results.push({
          stage: stageName,
          title: item?.title,
          answer: item?.content
        });
       }
      } catch (e) {
        console.warn(`⚠️ ${key} 파싱 실패:`, e);
      }
    }

    console.groupEnd();
  }

  console.log("✅ 모든 인터뷰 데이터 결과:", results);
  return results;
})();


function showSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) spinner.style.display = "flex";
}

function hideSpinner() {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) spinner.style.display = "none";
}

/********************************************
 * 🧠 GPT 기반 자서전 본문 생성 (프롬프트 복원)
 ********************************************/
async function generateAutobiographyFromInterviews() {
  const interviews = loadInterviewData();
  if (!interviews.length) {
    console.warn("⚠️ 인터뷰 데이터가 없습니다.");
    return [];
  }

  // 인터뷰 내용을 하나의 긴 프롬프트로 연결
  const contentSummary = interviews
    .map(it => `🔹 [${it.stage}] ${it.question}\n${it.answer}\n`)
    .join("\n\n");

const prompt = `
너는 사용자의 인터뷰 답변을 바탕으로 감동적인 자서전을 집필하는 전문 작가야.

[작업 지시]
아래 [인터뷰 데이터]를 읽고, 각 질문(question)에 대한 답변(answer)을 **1인칭 회고체(자서전 문체)**로 재작성해줘.

1.  **내용 확장:** 답변(answer)은 단순한 구어체 녹취록이야. 이 답변의 **핵심 사실은 유지**하되, **그때의 감정이나 상황을 묘사하며 살을 붙여 내용을 풍성하게 늘려줘.**
2.  **문체 변환:** 구어체("...했어요")를 문어체("...했다.")나 회고체("...했던 기억이 난다.")로 자연스럽게 윤문해줘.
3.  **제목 유지:** 각 항목의 **질문 제목(title)은 절대 변경하지 말고** 그대로 사용해줘.
4.  **뚱딴지같은 내용 금지:** 없는 사실을 지어내지 말고, 오직 답변 내용에 근거해서만 내용을 확장해야 해.

[출력 형식]
출력은 반드시 JSON 형태로 반환하되, 아래 예시 구조를 따라야 해.
(예시의 title과 content는 실제 데이터를 사용하지 말고, 이 구조만 참고해.)

{
  "sections": [
    {
      "stage": "유아기",
      "entries": [
        { "title": "당시의 질문 제목 1", "content": "(GPT가 내용을 확장하고 다듬은 자서전 본문)" },
        { "title": "당시의 질문 제목 2", "content": "(GPT가 내용을 확장하고 다듬은 자서전 본문)" }
      ]
    },
    {
      "stage": "청소년기",
      "entries": [
        { "title": "당시의 질문 제목 3", "content": "(GPT가 내용을 확장하고 다듬은 자서전 본문)" }
      ]
    }
  ]
}

[인터뷰 데이터]
${contentSummary}
`;


  try {
    showSpinner(); // ✅ 로딩 시작
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "너는 따뜻한 감성으로 사람의 삶을 이야기처럼 풀어주는 작가야." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    const data = await res.json();
    hideSpinner(); // ✅ 로딩 완료

    const json = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    const sections = json.sections || [];

    const merged = [];
    sections.forEach(sec => {
      sec.entries?.forEach(entry => {
        merged.push({
          stage: sec.stage,
          question: entry.title,  // 질문 그대로 제목으로 사용
          answer: entry.content
        });
      });
    });

    console.log("📚 GPT 자서전 생성 완료 (질문 단위):", merged);
    return merged;

  } catch (e) {
    hideSpinner(); // ✅ 에러 시에도 로딩 닫기
    console.error("❌ 자서전 생성 오류:", e);
    return [];
  }
}


/********************************************
 *실행
 ********************************************/
window.addEventListener("DOMContentLoaded", async () => {
    // ✅ 자서전 제목 불러오기
  const titleEl = document.getElementById("autobio-title");
  const dateEl = document.getElementById("autobio-date");

  const savedTitle = localStorage.getItem("autobiographyTitle") || "나의 특별한 이야기";
  titleEl.textContent = savedTitle;

  // ✅ 오늘 날짜 자동 표시 (YYYY. MM. DD 형식)
  const today = new Date();
  const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}`;
  dateEl.textContent = formattedDate;
  
  
  // 1️⃣ GPT를 통해 자서전 원문 생성
  const interviewData = await generateAutobiographyFromInterviews();

  // 👉 생성된 자서전 내용을 인쇄 페이지에서도 쓰기 위해 저장
localStorage.setItem("autobio_interviewData", JSON.stringify(interviewData));


  // 2️⃣ 생성된 내용 없으면 안내문
  if (!interviewData.length) {
    document.querySelector(".autobio-container").innerHTML = `
      <p style="font-size:24px;text-align:center;margin-top:120px;">
        아직 인터뷰 기록이 없습니다.<br>먼저 인터뷰를 진행해주세요.
      </p>`;
    return;
  }

  // 3️⃣ 자서전 빌드
  spreadData = buildPagedSpreads(interviewData);
  renderSpread();
});


/********************************************
 * LocalStorage에서 실제 인터뷰 기록 불러오기
 ********************************************/
function loadInterviewData() {
  const stageMap = {
    child: "유아기",
    teen: "청소년기",
    adult: "성인기",
    middle: "중년기",
    senior: "노년기"
  };

  const questions = [];

  // 모든 스테이지 순회
  for (const [prefix, stageName] of Object.entries(stageMap)) {
    // 해당 스테이지의 인터뷰 키들만 필터
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`interview_${prefix}_`));

    keys.sort(); // 시간 순 정렬 (선택사항)

    for (const key of keys) {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (item && item.content && item.title && item.title.endsWith('?')) {
          questions.push({
            stage: stageName,
            question: item.title,  // 사전 인터뷰 질문 제목
            answer: item.content   // 사용자의 전사 내용
          });
        }
      } catch (e) {
        console.warn("⚠️ 인터뷰 데이터 파싱 실패:", key, e);
      }
    }
  }

  console.log("📘 인터뷰 데이터 로드 완료:", questions);
  return questions;
}


/********************************************
 * 문자 단위 페이지 나누기 (수정된 버전)
 ********************************************/
// autobiography.js 파일의 buildPagedSpreads 함수를 이걸로 교체하세요.

function buildPagedSpreads(questions) {
  const spreads = [];
  const measureBox = document.getElementById("measure-box");
  Object.assign(measureBox.style, {
    width: "470px", // 💡 1. 너비 수정 적용됨
    fontSize: "32px",
    lineHeight: "61.5px",
    fontFamily: "'Kim jung chul Myungjo', serif",
    whiteSpace: "pre-wrap",
    padding: "0",
    border: "none",
    textAlign: "justify", // 💡 이 한 줄을 추가해주세요!
  });

  const maxHeightLeft = 524;
  const maxHeightRight = 524;
  const buffer = 0; 

  let currentPage = { left: "", right: "", leftMeta: null, rightMeta: null };
  let pageSide = "left";

  for (const q of questions) {
    let remainingText = q.answer.replace(/\s*\n\s*/g, " ").trim();
    let isFirstPageOfQuestion = true;

    while (remainingText.length > 0) {
      let headerHeight = 0;
      if (isFirstPageOfQuestion) {
        const tempHeader = document.createElement('div');
        tempHeader.className = 'content-label';
        tempHeader.innerHTML = `<p>${q.stage}</p><h1>${q.question}</h1>`;
        measureBox.appendChild(tempHeader);
        headerHeight = tempHeader.offsetHeight;
        measureBox.innerHTML = '';
      }

// 👇 limit 계산식에 "- buffer"를 추가합니다.
      const limit = (pageSide === "left"
        ? maxHeightLeft - headerHeight
        : maxHeightRight - headerHeight) - buffer; // 💡 안전 여유 공간 적용

      // 💡 2. 단어 단위로 텍스트를 채우는 개선된 로직
      const words = remainingText.split(' ');
      let textForThisPage = "";
      let tempText = "";

      for (let i = 0; i < words.length; i++) {
        tempText += (i > 0 ? " " : "") + words[i];
        measureBox.textContent = tempText;

        if (measureBox.scrollHeight > limit) {
          // 넘쳤으므로, 이전까지의 텍스트를 이 페이지의 내용으로 확정
          break;
        }
        textForThisPage = tempText;
      }
      
      // 사용한 텍스트를 전체 텍스트에서 제거
      remainingText = remainingText.slice(textForThisPage.length).trim();
      
      // 페이지에 내용 할당
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
  return spreads;
}





/********************************************
 * 렌더링
 ********************************************/
let currentSpread = 0;
let spreadData = [];

function renderSpread() {
  const s = spreadData[currentSpread];
  if (!s) return;
  const container = document.querySelector(".autobio-container");

  const leftHeader = s.leftMeta
    ? `<div class="content-label">
         <p>${s.leftMeta.stage}</p>
         <h1>${s.leftMeta.question}</h1>
       </div>`
    : ""; // ❌ 빈 div 제거

  const rightHeader = s.rightMeta
    ? `<div class="content-label">
         <p>${s.rightMeta.stage}</p>
         <h1>${s.rightMeta.question}</h1>
       </div>`
    : ""; // ❌ 빈 div 제거

  container.innerHTML = `
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

  document.querySelector(".current").textContent = currentSpread + 1;
  document.querySelector(".total").textContent = spreadData.length;
}


/********************************************
 * 📄 PDF 인쇄용 : 헤더 + 스프레드 + 페이지 번호를
 *                한 덩어리(print-page)로 여러 개 렌더
 ********************************************/
function renderAllSpreadsForPrint() {
  const container = document.querySelector(".autobio-container");
  if (!container) {
    console.warn("📄 .autobio-container를 찾지 못했습니다.");
    return;
  }
  if (!spreadData || !spreadData.length) {
    console.warn("📄 spreadData가 비어 있습니다.");
    return;
  }

  // 화면 상단에 이미 있는 자서전 제목/날짜 텍스트 가져오기
  const titleText = document.getElementById("autobio-title")?.textContent || "";
  const dateText  = document.getElementById("autobio-date")?.textContent  || "";

  let html = "";

  spreadData.forEach((s, idx) => {
    if (!s) return;

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

    const currentPage = idx + 1;
    const totalPages  = spreadData.length;

    // 🧩 여기서부터가 "PDF 한 장짜리" 구조
    html += `
      <section class="print-page">
        <!-- ⬆⬆⬆ 이 전체 section 하나가 PDF에서 1장 -->

        <!-- 상단 헤더(원래 네비바와 비슷한 형태) -->
        <header class="print-header">
          <h1 class="print-title">${titleText}</h1>
          <p class="print-date">${dateText}</p>
        </header>

        <!-- 가운데 내용 : 기존 spread-wrapper 그대로 -->
        <div class="spread-wrapper">
          <div class="page page-left">
            ${leftHeader}
            <div class="story-text">${s.left || ""}</div>
          </div>
          <div class="page page-right">
            ${rightHeader}
            <div class="story-text">${s.right || ""}</div>
          </div>
        </div>

        <!-- 하단 페이지 번호 -->
        <footer class="print-footer">
          <span class="current">${currentPage}</span>
          /
          <span class="total">${totalPages}</span>
        </footer>
      </section>
    `;
  });

  container.innerHTML = html;
}




/********************************************
 * 페이지 이동
 ********************************************/
document.getElementById("btn-page-next").addEventListener("click", () => {
  if (currentSpread < spreadData.length - 1) {
    currentSpread++;
    renderSpread();
  }
});

document.getElementById("btn-page-back").addEventListener("click", () => {
  if (currentSpread > 0) {
    currentSpread--;
    renderSpread();
  }
});


/********************************************
 * PDF 오버레이
 ********************************************/

function showPdfOverlay() {
  const ov = document.getElementById("pdf-overlay");
  if (ov) ov.style.display = "flex";
}

function hidePdfOverlay() {
  const ov = document.getElementById("pdf-overlay");
  if (ov) ov.style.display = "none";
}


/********************************************
 * PDF 오버레이 + print
 ********************************************/
const pdfBtn = document.getElementById("btn-export-pdf");

if (pdfBtn) {
  // 인쇄가 끝났을 때 화면 원복
  window.addEventListener("afterprint", () => {
    console.log("🖨 afterprint 이벤트 - 화면 복구");
    hidePdfOverlay();
    document.body.classList.remove("pdf-mode");
    // 다시 현재 페이지 1 spread만 보이도록
    renderSpread();
  });

  pdfBtn.addEventListener("click", () => {
    console.log("📄 PDF 버튼 클릭! spreadData 길이:", spreadData ? spreadData.length : "없음");

    document.body.classList.add("pdf-mode");
    showPdfOverlay();

    // ⚠ 이 안에서 에러가 나도 print는 꼭 실행되도록 try/catch
    try {
      renderAllSpreadsForPrint();
    } catch (e) {
      console.error("❌ renderAllSpreadsForPrint 오류:", e);
    }

    // DOM이 다시 그려질 시간을 준 뒤 인쇄창 호출
    setTimeout(() => {
      console.log("🖨 window.print() 호출");
      window.print();
    }, 300);
  });
}
