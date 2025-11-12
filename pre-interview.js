/*************** SpeechRecognition 준비 ***************/
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SR ? new SR() : null;

const answerEl  = document.getElementById('answer');
const guideEl   = document.getElementById('guide-text');
const outEl     = document.getElementById('output-text');

const btnStart   = document.getElementById('btn-record-start');
const btnStop    = document.getElementById('btn-stop');
const btnRestart = document.getElementById('btn-restart');
const btnNext    = document.getElementById('btn-next');


const pageTitleEl = document.getElementById('page-title');
const questionTextEl = document.getElementById('question-text');
const heroImageEl = document.getElementById('hero-image');


/*************** 페이지 설정(유아기~노년기 전체) ***************/
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const stage = urlParams.get('stage'); 

    // ✅ 로컬스토리지에서 성별 불러오기 (기본값은 "할머니")
    const gender = localStorage.getItem("selectedGender") || "할머니";
    console.log("👩 선택된 성별:", gender);

    // ✅ 뒤로가기 버튼 설정 (narration.html로 이동)
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            const returnStep = urlParams.get("returnStep") || "1";
            window.location.href = `narration.html?step=${returnStep}`;
        });
    }

    // ✅ 단계별 화면 설정
    if (stage === 'child') {
        pageTitleEl.textContent = '유아기 (0-12세)';
        questionTextEl.innerHTML = `${gender}! 유아기 시절에 가장<br/>인상 깊었던 일들을 말씀해 주세요.`;
        heroImageEl.src = 'image/child_bg.svg';
        heroImageEl.alt = '유아기 일러스트';
        pageTitleEl.style.color = 'black';
        questionTextEl.style.color = 'black';

    } else if (stage === 'teen') {
        pageTitleEl.textContent = '청소년기 (13-19세)';
        questionTextEl.innerHTML = `${gender}! 청소년기 시절에 가장<br/>인상 깊었던 일들을 말씀해 주세요.`;
        heroImageEl.src = 'image/teen_bg.svg';
        heroImageEl.alt = '청소년기 일러스트';
        pageTitleEl.style.color = 'black';
        questionTextEl.style.color = 'black';

    } else if (stage === 'adult') {
        pageTitleEl.textContent = '성인기 (20-39세)';
        questionTextEl.innerHTML = `${gender}! 성인기 시절에 가장<br/>인상 깊었던 일들을 말씀해 주세요.`;
        heroImageEl.src = 'image/adult_bg.svg';
        heroImageEl.alt = '성인기 일러스트';
        pageTitleEl.style.color = 'white';
        questionTextEl.style.color = 'white';

    } else if (stage === 'middle') {
        pageTitleEl.textContent = '중년기 (40-64세)';
        questionTextEl.innerHTML = `${gender}! 중년기 시절에 가장<br/>인상 깊었던 일들을 말씀해 주세요.`;
        heroImageEl.src = 'image/middle_bg.svg';
        heroImageEl.alt = '중년기 일러스트';
        pageTitleEl.style.color = 'black';
        questionTextEl.style.color = 'black';

    } else if (stage === 'senior') {
        pageTitleEl.textContent = '노년기 (65세 이상)';
        questionTextEl.innerHTML = `${gender}! 노년기 시절에 가장<br/>인상 깊었던 일들을 말씀해 주세요.`;
        heroImageEl.src = 'image/senior_bg.svg';
        heroImageEl.alt = '노년기 일러스트';
        pageTitleEl.style.color = 'black';
        questionTextEl.style.color = 'black';

    } else {
        // ✅ 예외 처리 (stage가 없을 경우)
        pageTitleEl.textContent = '사전 인터뷰';
        questionTextEl.innerHTML = `${gender}! 인생에서 기억에 남는 일들을 말씀해 주세요.`;
        heroImageEl.src = 'image/default_bg.svg';
        heroImageEl.alt = '기본 배경';
        pageTitleEl.style.color = 'black';
        questionTextEl.style.color = 'black';
    }
});



/*************** 전사 기능 ***************/

let recognizing = false;
let finalBuf = "";
let lastInterim = "";   // 정지 직전 임시 전사 저장

if (recognition){
  recognition.lang = "ko-KR";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => { recognizing = true; };

  recognition.onresult = (ev) => {
    let interim = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++){
      const r = ev.results[i];
      if (r.isFinal) {
        finalBuf += (finalBuf ? " " : "") + r[0].transcript.trim();
      } else {
        interim += r[0].transcript;
      }
    }
    lastInterim = interim;                                   // ✅ interim 저장
    outEl.textContent = (finalBuf + " " + interim).trim();
    if (outEl.textContent) answerEl.classList.add('show-output'); // ✅ answerEl 사용
    outEl.scrollTop = outEl.scrollHeight;
  };

  // ❌ 중복 onend 제거, 여기 한 곳만 유지
  recognition.onend = () => {
    recognizing = false;

    // ✅ 정지 시 남은 interim까지 확정에 합침 → 전사 안 사라짐
    if (lastInterim.trim()){
      finalBuf += (finalBuf ? " " : "") + lastInterim.trim();
      lastInterim = "";
      outEl.textContent = finalBuf;
      outEl.scrollTop = outEl.scrollHeight;
    }

    // 다음/재시작 노출, 전사는 그대로 유지
    answerEl.classList.add('post-record');  // ✅ answerEl
    btnStart.disabled = false;
    btnStop.disabled  = true;

    // 전사가 전혀 없을 때만 가이드 복귀
    if (!finalBuf.trim()) answerEl.classList.remove('show-output'); // ✅ answerEl
  };

  recognition.onerror = () => {
    recognizing = false;
    btnStart.disabled = false;
    btnStop.disabled  = true;
  };
}

/*************** 녹음/정지/재시작 버튼 ***************/
btnStart.addEventListener('click', () => {
  if (!recognition || recognizing) return;
  // 이어 말하기: finalBuf/outEl 유지(완전 초기화 원하면 아래 2줄 주석 해제)
  // finalBuf = ""; outEl.textContent = "";
  answerEl.classList.remove('post-record');
  answerEl.classList.add('is-recording', 'show-output');
  btnStart.disabled = true; btnStop.disabled = false;
  recognition.start();
});

btnStop.addEventListener('click', () => {
  if (!recognition || !recognizing) return;
  recognition.stop();
//   answerEl.classList.remove('is-recording');  // show-output은 유지
});

btnRestart?.addEventListener('click', () => {
  // 완전 초기화 → 가이드/마이크 복귀
  finalBuf = ""; lastInterim = "";
  outEl.textContent = "";
  answerEl.classList.remove('post-record', 'is-recording', 'show-output');
  btnStart.disabled = false; btnStop.disabled = true;
});







/*************** 다음 버튼(전사내용저장+ 페이지 전환) ***************/

btnNext.addEventListener('click', () => {
    const content = outEl.textContent.trim();
    const currentPageTitle = pageTitleEl.textContent.trim();
    const urlParams = new URLSearchParams(window.location.search);
    const returnStep = urlParams.get("returnStep") || "3"; 
    const gender = localStorage.getItem("selectedGender") || "할머니";
  console.log("👩 선택된 성별:", gender);

    // 1. 데이터 저장 및 다음 상태 결정
    if (content) {
        let title = "";
        let keyPrefix = "";
        
        // 현재 페이지 상태에 따라 title과 keyPrefix 설정
        if (currentPageTitle === '유아기 (0-12세)') {
            title = "유아기 사전인터뷰";
            keyPrefix = "child";
        } else if (currentPageTitle === '청소년기 (13-19세)') {
            title = "청소년기 사전인터뷰";
            keyPrefix = "teen";
        } else if (currentPageTitle === '성인기 (20-39세)') {
            title = "성인기 사전인터뷰";
            keyPrefix = "adult";
        } else if (currentPageTitle === '중년기 (40-64세)') {
            title = "중년기 사전인터뷰";
            keyPrefix = "middle";
        } else if (currentPageTitle === '노년기 (65세 이상)') {
            title = "노년기 사전인터뷰";
            keyPrefix = "senior";
        }

        // 로컬 스토리지 저장 (공통)
        const dataToSave = { title, content, timestamp: new Date().toISOString() };
        const key = `interview_${keyPrefix}_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(dataToSave));
        localStorage.setItem("selectedStage", keyPrefix);
        console.log(`로컬 스토리지에 ${title} 답변이 저장되었습니다. 키: ${key}`);
        
         // 🔹 사용자가 실제로 무언가를 말함 = 진행 중 상태로 저장
        localStorage.setItem('stageStatus_1', 'in_progress');
        console.log('📍 1단계 진행 중 상태 저장됨');

    } else {
        // 답변이 없는 경우 콘솔에만 기록
        console.log(`${currentPageTitle} 답변이 없어 저장하지 않고 넘어갑니다.`);
    }

    // 2. 페이지 전환 및 이동 (로직 분기)
    if (currentPageTitle === '유아기 (0-12세)') {
        // 유아기 -> 청소년기 (페이지 내 전환)
        pageTitleEl.textContent = '청소년기 (13-19세)';
        questionTextEl.innerHTML = `${gender}! 청소년기 시절에 가장<br />인상 깊었던 일들을 말씀해 주세요.`;
        heroImageEl.src = 'image/teen_bg.svg';
        heroImageEl.alt = '청소년기 일러스트';

    } else if (currentPageTitle === '청소년기 (13-19세)') {
        // ✅ 청소년기 마지막이면 요약(내레이션) 페이지로 이동
        const nextStep = parseInt(returnStep) || 3;
        window.location.href = `narration.html?step=${nextStep}`;


    } else if (currentPageTitle === '성인기 (20-39세)') {
        // 성인기 -> 중년기 (페이지 내 전환)
        pageTitleEl.textContent = '중년기 (40-64세)';
        questionTextEl.innerHTML = `${gender}! 중년기 시절에 가장<br />인상 깊었던 일들을 말씀해 주세요.`;
        heroImageEl.src = 'image/middle_bg.svg'; // 중년기 이미지 경로
        heroImageEl.alt = '중년기 일러스트';
        pageTitleEl.style.color = 'black';
        questionTextEl.style.color = 'black';

    } else if (currentPageTitle === '중년기 (40-64세)') {
        // ✅ 중년기 → narration(노년기 단계로 복귀)
        // const nextStep = parseInt(returnStep) + 1;  // 예: 2 → 3
        const nextStep = parseInt(returnStep);
        window.location.href = "narration.html?step=5";

    } else if (currentPageTitle === '노년기 (65세 이상)') {
        // ✅ 노년기 → 마지막 마무리 내레이션(step 7)
        window.location.href = `narration.html?step=7`;

    }
    
    // 3. 화면 초기화 (외부 이동이 아닌 경우에만)
    // 외부로 이동하는 경우(청소년기, 중년기, 노년기)에는 초기화 코드가 필요 없습니다.
    if (currentPageTitle === '유아기 (0-12세)' || currentPageTitle === '성인기 (20-39세)') {
        finalBuf = "";
        lastInterim = "";
        outEl.textContent = "";
        answerEl.classList.remove('post-record', 'is-recording', 'show-output');
    }
});


