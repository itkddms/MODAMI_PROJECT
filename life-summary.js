








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

      // 🔹 뒤로가기 버튼 클릭 시 loadmap.html로 이동
  const btnBack = document.getElementById("btn-back");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      window.location.href = "roadmap.html";
    });
  }

});

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ URL 파라미터 감지만 사용 (localStorage는 무시)
  const params = new URLSearchParams(window.location.search);
  const stageParam = params.get("stage") || "child"; // 기본값 유아기

  // 스테이지 이름 매핑
  const prefixMap = {
    child: "유아기",
    teen: "청소년기",
    adult: "성인기",
    middle: "중년기",
    senior: "노년기",
  };

  // 🔹 URL에서 받은 값만 사용 (이전 스테이지 캐시 무시)
const prefix = Object.keys(prefixMap).find(k => prefixMap[k] === stageParam) ? stageParam : stageParam in prefixMap ? stageParam : "child";
const stageName = prefixMap[prefix] || "유아기";


  // UI 표시
  const container = document.getElementById("story-summary-list");
  const stageTextEl = document.getElementById("stage-text");
  stageTextEl.textContent = stageName;


  // ✅ 로컬스토리지에서 해당 stage의 전사 내용 가져오기
  const transcripts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(`interview_${prefix}_`)) {
      try {
        const { content } = JSON.parse(localStorage.getItem(key));
        if (content && content.trim()) transcripts.push(content.trim());
      } catch {}
    }
  }

  if (!transcripts.length) {
    container.innerHTML = `<div class="no-data">${stageName} 인터뷰 내용이 없습니다.</div>`;
    return;
  }

  // ✅ 로딩 UI 표시
  container.innerHTML = `<div class="loading">${stageName} 이야기를 정리 중이에요...</div>`;

  try {
    const fullText = transcripts.join("\n\n");
    const summary = await summarizeTranscript(fullText, stageName);
    const items = Array.isArray(summary.items) ? summary.items : [];

    // ✅ (1) 요약 결과 먼저 로컬스토리지에 저장
    localStorage.setItem(
      `summary_${prefix}_${Date.now()}`,
      JSON.stringify({ stage: stageName, items, time: new Date().toLocaleString() })
    );

    // ✅ (2) 이후 이미지 생성은 비동기로 렌더링
    renderSummaryCards(items);

  } catch (err) {
    console.error("요약 오류:", err);
    container.innerHTML = `<div class="error">요약 중 오류 발생: ${err.message}</div>`;
  }
  });

/*******************************
 * GPT 요약 요청
 *******************************/
async function summarizeTranscript(transcript, stage) {
    // if (window.APP_MODE?.MOCK) {
    // console.log("💬 [MOCK] 실제 API 호출 생략");
    // return "테스트 모드입니다. 실제 GPT 호출은 생략됩니다.";
    // }
    
    const messages = [
    {
      role: "system",
      content: `아래는 ${stage} 시기의 인터뷰 기록입니다.
이 내용을 '서사적 사건 단위'로 묶어 주세요.

- '사건 단위'는 문장 단위가 아니라, *하나의 기억·상황·감정이 이어지는 에피소드 단위*입니다.
- 같은 장소나 인물, 감정이 연결된 내용은 하나로 묶습니다.
- 불필요하게 세세한 문장 분리는 피하고, 한 사건이 전체적으로 이해될 수 있도록 묶습니다.
- 각 사건은 25자 내외의 요약(summary25)과, 그 장면을 표현하기 좋은 이미지 검색어(image_query)를 포함합니다.
- 제목(title)은 그 사건을 짧고 간결하게 표현한 이름으로 합니다.

출력 형식은 반드시 JSON만 포함해야 합니다.
형식:
{
  "items": [
    {
      "title": "사건 이름(짧게)",
      "summary25": "25자 내외 요약",
      "image_query": "이미지 검색어"
    }
  ]
}

예시:
입력:
"나는 어릴 때 할머니가 우리 동네에 오셔서 함께 학교를 다녔어요.
그날 놀이터에서 뛰어내리다 다쳐서 많이 울었던 기억이 있어요."

출력 예시:
{
  "items": [
    {
      "title": "할머니와의 아픈 추억",
      "summary25": "놀이터에서 다쳐 할머니가 걱정했던 기억",
      "image_query": "할머니와 어린 손녀, 놀이터, 따뜻한 감정"
    }
  ]
}

인터뷰 기록:
${transcript}`
,
    },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(raw);
}

/*******************************
 * 이미지 생성 + 카드 렌더링 (수정완료)
 *******************************/
async function renderSummaryCards(items) {
  const container = document.getElementById("story-summary-list");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `<div class="no-data">표시할 이야기가 없습니다.</div>`;
    return;
  }

  // ✅ 카드 개수에 따른 레이아웃 적용
  container.className = "summary-grid";
  if (items.length === 1) container.classList.add("layout-1");
  else if (items.length === 2) container.classList.add("layout-2");
  else if (items.length === 3) container.classList.add("layout-3");
  else container.classList.add("layout-scroll");

  const tasks = items.map(async (it, idx) => {
    const card = document.createElement("div");
    card.className = "summary-card";
    card.innerHTML = `
      <div class="summary-image" id="img-${idx}">
        <div class="img-skeleton">이미지 생성 중...</div>
      </div>
      <div class="summary-text">${escapeHTML(it.summary25 || it.title || "")}</div>
    `;
    container.appendChild(card);

    try {
      // ✅ 프롬프트가 없으면 기본 프롬프트로 대체
      const basePrompt = (it.image_query || it.title || it.summary25 || "").trim();
      const prompt = basePrompt
        ? `${basePrompt}, 어린 시절 추억을 표현한 일러스트`
        : "어린 시절의 추억을 표현한 따뜻한 3D 일러스트";

      const imgUrl = await generateImage(prompt);
      const holder = document.getElementById(`img-${idx}`);
      holder.innerHTML = imgUrl
        ? `<img src="${imgUrl}" alt="이미지" loading="lazy" />`
        : `<div class="img-fallback">이미지를 불러오지 못했어요</div>`;
    } catch (e) {
      console.warn("이미지 생성 실패:", e);
      document.getElementById(`img-${idx}`).innerHTML =
        `<div class="img-fallback">이미지 생성 실패</div>`;
    }
  });

  await Promise.allSettled(tasks);
}


/*******************************
 * 이미지 생성 함수 (수정 완료)
 *******************************/
async function generateImage(prompt) {
  //   if (window.APP_MODE?.MOCK || !window.APP_MODE?.IMAGE) {
  //   console.log("🖼️ [MOCK IMAGE] 이미지 생성 생략:", prompt);
  //   return "image/mock_placeholder.png"; // 더미 이미지 경로
  // }
  
  if (!prompt || prompt.length < 3) {
    prompt = "따뜻한 3D 스타일의 어린 시절 추억 장면";
  }

  const modelName = "dall-e-3";
  const styleSuffix =
    `minimal 3D clay illustration, focused on one or two main characters,
Korean childhood moment expressed simply and warmly,
soft matte clay material, pastel colors with gentle contrast,
beige and warm tones (light brown, ivory, mint, peach),
very few background objects, plain simple background,
rounded characters with emotional expressions,
cute handmade miniature look, calm composition,
no crowd, no complex scenery, no busy environment,
soft ambient lighting, storybook warmth and innocence`;
  const fullPrompt = `${prompt}. ${styleSuffix}`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelName,
      prompt: fullPrompt,
      size: "1024x1024",
      // ✅ response_format 삭제 (이게 문제였음)
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("❌ 이미지 생성 실패:", data.error || data);
    throw new Error(data.error?.message || "이미지 API 오류");
  }

  return data.data?.[0]?.url || null;
}



/*******************************
 * 유틸: HTML escape
 *******************************/
function escapeHTML(s) {
  return String(s).replace(/[<>&"]/g, (m) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[m]));
}


/*******************************
 * 다음 버튼 수정 버전
 *******************************/
document.addEventListener("DOMContentLoaded", () => {
  const nextButton = document.getElementById("btn-next");
  const params = new URLSearchParams(window.location.search);
  const currentStage = params.get("stage") || "child";

  if (!nextButton) return;

  nextButton.addEventListener("click", () => {
    // 각 단계 묶음 구성
    const stageGroups = [
      ["child", "teen"],      // 2단계
      ["adult", "middle"],    // 3단계
      ["senior"]              // 4단계
    ];

    // 현재 시기가 어느 그룹에 속하는지 찾기
    let currentGroupIndex = stageGroups.findIndex(group => group.includes(currentStage));
    if (currentGroupIndex === -1) currentGroupIndex = 0;

    const group = stageGroups[currentGroupIndex];
    const currentIndexInGroup = group.indexOf(currentStage);

    if (currentIndexInGroup < group.length - 1) {
      // 🔹 같은 그룹 내 다음 시기로 이동 (예: 유아기 → 청소년기)
      const nextStage = group[currentIndexInGroup + 1];
      window.location.href = `life-summary.html?stage=${nextStage}`;
    } else {
      // 🔹 그룹 마지막 시기면 main-interview로 이동
      const interviewStage = group[0]; // ✅ 그룹의 첫 시기값으로 이동
      window.location.href = `main-interview.html?stage=${interviewStage}`;
    }
  });
});





