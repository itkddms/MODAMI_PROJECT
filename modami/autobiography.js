// ✅ 공통 상수
const API_BASE = "https://modami-server.onrender.com";


/*******************************************************
 * autobiography.js — 문자 단위 overflow 감지 (완전 교정 버전)
 *******************************************************/
const OPENAI_API_KEY = window.OPENAI_API_KEY || "sk";
const model = "gpt-4o-mini";

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
너는 감성적이고 따뜻한 한국어 문체로 글을 쓰는 작가야.  
아래는 사용자가 생애 각 시기별로 직접 말한 인터뷰 내용이야.  
이 내용을 바탕으로 자서전 한 권에 들어갈 문장을 작성해줘.  

규칙:
- 시기별로 연결감 있게 구성하되, 실제 화자의 말투를 최대한 보존해줘.
- 각 시기마다 10문장 정도로 구성해.
- 존댓말이 아닌, 회상체 중심의 서술로 써줘.
- JSON 형태로 시기별 나눠서 반환해.

출력 형식:
{
  "sections": [
    { "stage": "유아기", "title": "어린 시절의 기억", "content": "..." },
    { "stage": "청소년기", "title": "청춘의 한 페이지", "content": "..." },
    ...
  ]
}

인터뷰 기록:
${contentSummary}
`;

  try {
  // 🔹 아래로 교체
const res = await fetch(`${API_BASE}/api/gpt`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: prompt }) // ✅ prompt만 보내면 서버가 알아서 GPT 호출
  });


    const data = await res.json();
    const json = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    const sections = json.sections || [];

    console.log("📚 GPT 자서전 생성 완료:", sections);
    return sections.map(s => ({
      stage: s.stage,
      question: s.title || `${s.stage}의 이야기`,
      answer: s.content
    }));
  } catch (e) {
    console.error("❌ 자서전 생성 오류:", e);
    return [];
  }
}


/********************************************
 *실행
 ********************************************/
window.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ GPT를 통해 자서전 원문 생성
  const interviewData = await generateAutobiographyFromInterviews();

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
        if (item && item.content && item.title) {
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
 * 초기 실행
 ********************************************/
// window.addEventListener("DOMContentLoaded", () => {
//   spreadData = buildPagedSpreads(demoQuestions);
//   renderSpread();
// });
