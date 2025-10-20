async function unlockAudioContext() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = audioCtx.createBuffer(1, 1, 22050);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);

  return new Promise((resolve) => {
    // 사용자가 처음 클릭했을 때만 resume 시도
    const resume = () => {
      if (audioCtx.state === "suspended") {
        audioCtx.resume().then(() => {
          source.start(0);
          document.removeEventListener("click", resume);
          resolve();
        });
      } else {
        resolve();
      }
    };

    document.addEventListener("click", resume);
  });
}


window.addEventListener('pageshow', function (event) {
    // event.persisted가 true이면 페이지가 캐시에서 복원되었다는 의미입니다.
    if (event.persisted) {
        // ✅ 캐시를 무시하고 페이지를 완전히 새로고침합니다.
        console.log("BFcache 감지! 강제 리로드 실행."); // 로그 추가
        window.location.reload(); 
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // 무음 오디오 먼저 실행
    await unlockAudioContext();

    // 초기 인덱스 결정 (text1 or text4)
    setTimeout(() => {
        showNextText();
    }, currentTextIndex === 0 ? 2000 : 0);
});


document.addEventListener('DOMContentLoaded', () => {

    let currentAudio = null;
    let currentTextIndex = 0;
    let typingInterval = null;
    let nextTextTimeout = null;
    
    const gender = localStorage.getItem('selectedGender') || '할머니';

    // 텍스트 템플릿 정의
    const textTemplates = [
        { id: "text1", displayText: `${gender}가 들려주신 이야기 잘 들었어요! 이제 다음 단계로 넘어갈까요?`, ttsScript: `${gender}가 들려주신 이야기 잘 들었어요! 이제 다음 단계로 넘어갈까요?` },
        { id: "text2", displayText: `기억들을 회고 하기 전에 담이가 ${gender}의 성인기,  중년기 시절의 사진과 노래를 보여드릴게요.`, ttsScript: `기억들을 회고 하기 전에 담이가 ${gender}의 성인기,  중년기 시절의 사진과 노래를 보여드릴게요.` },
    ];

    // 1. DOM 요소 찾기 및 텍스트 초기화
    const nextBtn = document.querySelector('.nextbtn');
    const skipBtn = document.querySelector('.skip_btn');
    
    const textElements = textTemplates.map(item => ({ id: item.id, tts: item.ttsScript }));
    const texts = []; // DOM 요소를 담을 배열

    textTemplates.forEach(template => {
    const element = document.getElementById(template.id);
    if (element) {
        element.dataset.original = template.displayText; 
        element.style.display = 'none'; 
        element.innerHTML = '';  // 글자는 나중에 typeWriter로만 찍힘
        texts.push(element); 
    }
});

    // ... (DOMContentLoaded 내부 코드 시작) ...

// 2. 초기 시작 인덱스 결정 (localStorage 최우선 순위)
const urlParams = new URLSearchParams(window.location.search);
const startFrom = urlParams.get('start'); // 기존 URL 파라미터 로직 유지 (보험)
const forceStart = localStorage.getItem('force_text_start'); // ✅ 새로 추가된 localStorage 값

let initialIndex = 0; // 기본값은 text1 (인덱스 0)

if (forceStart === 'text4') {
    initialIndex = 3; // text4의 인덱스는 3
    localStorage.removeItem('force_text_start'); // ✅ 사용 후 즉시 삭제
} 
// 참고: 'adult'나 'old' 시기 전환 로직은 이미 외부 파일에서 처리하고 있으므로, 
// 여기서는 나레이션 페이지에 집중합니다.

currentTextIndex = initialIndex;

// 3. 버튼 노출 설정
if(nextBtn) nextBtn.style.display = 'block';
if(skipBtn) skipBtn.style.display = currentTextIndex === 3 ? 'none' : 'block';
// Skip Button 이벤트 리스너
if (skipBtn) { 
    skipBtn.addEventListener('click', () => { 
        goToPageWithFade('history.html');  // ✅ 오버레이 적용
    }); 
}


// 4. 나레이션 시작 (최종 실행)
setTimeout(() => {
    showNextText();
}, currentTextIndex === 0 ? 1000 : 0); // text1 시작일 때만 2초 딜레이, text4 시작은 딜레이 없음

// ... (나머지 showNextText, typeWriter 함수 등은 변경 없음) ...

    // ==========================================================
    // TTS API 호출 함수 (getTtsAudio)
    // ==========================================================
    async function getTtsAudio(textScript) {
        const apiKey = "AIzaSyBKLaoIvgJ-ch0wZSPIxm5HhqJLvGRIbNM";
        const apiUrl = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`;
        const payload = {
            input: { text: textScript },
            voice: { languageCode: "ko-KR", name: "ko-KR-Chirp3-HD-Zephyr" },
            audioConfig: { audioEncoding: "MP3", speakingRate: 1.02 }
        };
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) { console.error(`API Error: ${response.status}`); return null; }
            const result = await response.json();
            const audioContent = result?.audioContent;
            if (audioContent) {
                const audioUrl = `data:audio/mp3;base64,${audioContent}`;
                const audio = new Audio(audioUrl);
                return new Promise((resolve) => {
                    audio.addEventListener('loadedmetadata', () => resolve({ audio, duration: audio.duration }));
                });
            }
            return null;
        } catch (error) { console.error("TTS API 호출 오류:", error); return null; }
    }


    // ==========================================================
    // 텍스트 출력 함수 (showNextText)
    // ==========================================================
    function showNextText() {
        // 현재 오디오/타이핑 강제 중지
        if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
        clearTimeout(nextTextTimeout);
        if (typingInterval) { clearInterval(typingInterval); }

        // 모든 텍스트 출력 완료 확인
        if (currentTextIndex >= texts.length) { 
            return;
        }

        // 이전 텍스트 숨기기
        if (currentTextIndex > 0) {
            const prevEl = texts[currentTextIndex - 1];
            if(prevEl) prevEl.style.display = 'none';
        }
        
        // text4 출력 시 스킵 버튼 숨김
        if (currentTextIndex === 3 && skipBtn) {
            skipBtn.style.display = 'none';
        }

        const currentElement = texts[currentTextIndex];
        const { tts } = textElements[currentTextIndex];
        
        typeWriter(currentElement, currentElement.dataset.original, tts);
        currentTextIndex++;
    }

    // ==========================================================
    // 타이핑 및 오디오 동기화 함수 (typeWriter)
    // ==========================================================
    async function typeWriter(element, text, ttsScript) {
        if(!element || !text) return;
        
        clearTimeout(nextTextTimeout); 
        
        element.style.display = 'block';
        element.innerHTML = '';
        element.classList.add('fade-in');

        const audioData = await getTtsAudio(ttsScript);

        if (audioData) {
            const { audio, duration } = audioData;
            currentAudio = audio;
            
            const pureText = text.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '').trim(); 
            const totalChars = pureText.length;
            
            audio.play().catch(e => console.error("Audio playback failed:", e));
            
            let typedChars = 0;
            let charIndexInOriginalText = 0;
            
            if (typingInterval) clearInterval(typingInterval); 
            
            typingInterval = setInterval(() => {
                if (audio.paused || audio.ended) {
                    clearInterval(typingInterval);
                    element.innerHTML = text; 
                    element.classList.remove('fade-in');
                    
                    // 자동 넘김
                    if (audio.ended) {
                        nextTextTimeout = setTimeout(showNextText, 2000); 
                    }
                    return;
                }
                
                const elapsedTime = audio.currentTime;
                const targetChars = Math.min(totalChars, Math.floor(elapsedTime * (totalChars / duration)));

                while (typedChars < targetChars && charIndexInOriginalText < text.length) {
                    const char = text.charAt(charIndexInOriginalText);
                    
                    if (char === '<') {
                        const tagEnd = text.indexOf('>', charIndexInOriginalText);
                        if (tagEnd !== -1) {
                             element.innerHTML += text.substring(charIndexInOriginalText, tagEnd + 1);
                             charIndexInOriginalText = tagEnd + 1;
                        } else {
                             charIndexInOriginalText++;
                        }
                    } else {
                        element.innerHTML += char;
                        charIndexInOriginalText++;
                        typedChars++;
                    }
                }
            }, 10);
        } else {
            // 오디오 실패 시 로직 (자동 진행 유지)
            console.error("오디오 로드 실패! 텍스트만 출력합니다.");
            let i = 0;
            if (typingInterval) clearInterval(typingInterval);
            typingInterval = setInterval(() => {
                if (i < text.length) {
                    if (text.charAt(i) === '<') {
                        const tagEnd = text.indexOf('>', i);
                        element.innerHTML += text.substring(i, tagEnd + 1);
                        i = tagEnd + 1;
                    } else {
                        element.innerHTML += text.charAt(i);
                        i++;
                    }
                } else {
                    clearInterval(typingInterval);
                    nextTextTimeout = setTimeout(showNextText, 2000); 
                }
            }, 50);
        }
    }


    // ==========================================================
    // 이벤트 리스너 (Next Button)
    // ==========================================================
    if (nextBtn) { 
    nextBtn.addEventListener('click', () => {
        clearTimeout(nextTextTimeout); 
        if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
        if (typingInterval) { clearInterval(typingInterval); }

        // 현재 텍스트 즉시 완료 처리
        if (currentTextIndex > 0 && currentTextIndex <= texts.length) {
            const currentElement = texts[currentTextIndex - 1];
            if (currentElement && currentElement.dataset.original) {
                currentElement.innerHTML = currentElement.dataset.original;
                currentElement.classList.remove('fade-in');
            }
        }

        // 🔑 분기 처리
        if (currentTextIndex === 3) {  
            // text3 → history.html
            localStorage.setItem('force_text_start', 'text4');
            goToPageWithFade('history.html');   // ✅ 여기 수정
            return;
        } else if (currentTextIndex === 4) {  
            // text4 → pre-interview.html
            goToPageWithFade('pre-interview.html');  // ✅ 여기 수정
            return;
        }

        // 그 외에는 다음 텍스트로 진행
        showNextText();
    });
    }

});

// const overlay = document.querySelector('.fade-overlay');

function goToPageWithFade(url) {
  const fade = document.getElementById('page-fade');
  if (!fade) {
    window.location.href = url; // 안전장치
    return;
  }
  fade.classList.add('active');
  setTimeout(() => {
    window.location.href = url;
  }, 700); // transition 시간(0.7s)과 동일하게
}
