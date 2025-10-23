document.addEventListener('DOMContentLoaded', () => {

    // --- 요소 선택 ---
    const mainNextButton = document.querySelector('.btn_container .next_btn');
    const genderButtons = document.querySelectorAll('.gender_btn button');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step2Title = document.querySelector('#step2 h1');
    const step3Title = document.querySelector('#step3 h1');
    const chapterCurrent = document.querySelector('.chapter .current');

    // --- 상태 변수 ---
    let selectedGender = '';

    // ========================================================================
    // ▼▼▼ 제목 추천 및 음성 인식 기능 ▼▼▼
    // ========================================================================

    // 키워드 기반으로 제목을 생성하는 함수
    const generateTitleFromText = (text) => {
        const keywords = {
            '행복': '나의 행복한 시절',
            '사랑': '사랑을 담은 이야기',
            '도전': '도전으로 가득찬 나의 삶',
            '인생': '나의 특별한 인생 이야기',
            '추억': '소중한 추억들',
            '청춘': '눈부셨던 나의 청춘'
        };

        for (const keyword in keywords) {
            if (text.includes(keyword)) {
                return keywords[keyword]; // 키워드가 발견되면 추천 제목 반환
            }
        }
        
        let cleanedTitle = text.trim();
        if (cleanedTitle.length > 20) {
            return '나의 특별한 이야기';
        }
        return cleanedTitle || '나의 특별한 이야기';
    };

    // 실시간 음성 인식 기능 함수
    const setupSpeechRecognition = (step, sectionId, startBtnId, stopBtnId, restartBtnId, nextBtnId, outputId) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("이 브라우저는 음성 인식을 지원하지 않습니다.");
            return;
        }

        const answerSection = document.getElementById(sectionId);
        const recordBtn = document.getElementById(startBtnId);
        const stopBtn = document.getElementById(stopBtnId);
        const restartBtn = document.getElementById(restartBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const outputText = document.getElementById(outputId);

        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = true;
        recognition.interimResults = true;

        let finalTranscript = '';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            // finalTranscript = ''; // <- 버그를 유발하던 이 줄을 삭제했습니다.
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            outputText.textContent = finalTranscript + interimTranscript;
        };
        
        recognition.onend = () => {
            answerSection.classList.remove('is-recording');
            answerSection.classList.add('post-record');
            stopBtn.disabled = true;

            if (step === 3 && outputText.textContent) {
                const suggestedTitle = generateTitleFromText(outputText.textContent);
                outputText.textContent = suggestedTitle;
                console.log(`추천된 제목: ${suggestedTitle}`);
            }
        };

        const startRecognition = () => {
            finalTranscript = '';
            outputText.textContent = '';
            recognition.start();
            answerSection.classList.add('is-recording');
            answerSection.classList.remove('post-record');
            stopBtn.disabled = false;
        };
        
        const stopRecognition = () => {
            recognition.stop();
        };

        const restartRecognition = () => {
            finalTranscript = '';
            outputText.textContent = '';
            answerSection.classList.remove('is-recording');
            answerSection.classList.remove('post-record');
            stopBtn.disabled = true;
        };

        recordBtn.addEventListener('click', startRecognition);
        stopBtn.addEventListener('click', stopRecognition);
        restartBtn.addEventListener('click', restartRecognition);

        nextBtn.addEventListener('click', () => {
            const recordedText = outputText.textContent;
            
            if (step === 2) {
                // 출생년도 처리
                if (recordedText) {
                    const numbers = recordedText.match(/\d+/g);
                    if (numbers) {
                        const year = numbers[0];
                        localStorage.setItem(`recordedText_step${step}`, year);
                        console.log(`[Step ${step}] 추출된 출생년도 ${year}를 LocalStorage에 저장했습니다.`);
                    }
                }
                goToStep3();
            } 
            
            else if (step === 3) {
                // 제목 처리
                if (recordedText) {
                    localStorage.setItem(`recordedText_step${step}`, recordedText);
                    localStorage.setItem("autobiographyTitle", recordedText); // ✅ 자서전 제목 저장
                    console.log(`[Step ${step}] 자서전 제목 "${recordedText}"를 LocalStorage에 저장했습니다.`);
                } else {
                    alert("자서전 제목을 말씀해 주세요.");
                    return;
                }

                goToNextPage();
            }
        });

    };

    // 각 단계의 녹음 UI에 기능 적용
    setupSpeechRecognition(2, 'answer-step2', 'btn-record-start-step2', 'btn-stop-step2', 'btn-restart-step2', 'btn-next-step2', 'output-text-step2');
    setupSpeechRecognition(3, 'answer-step3', 'btn-record-start-step3', 'btn-stop-step3', 'btn-restart-step3', 'btn-next-step3', 'output-text-step3');

    // ========================================================================
    // ▲▲▲ 기능 끝 ▲▲▲
    // ========================================================================

    // --- 이벤트 리스너 및 단계 전환 함수 ---
    genderButtons.forEach(button => {
        button.addEventListener('click', () => {
            genderButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedGender = button.textContent.includes('남자') ? '할아버지' : '할머니';
            localStorage.setItem('selectedGender', selectedGender);
        });
    });

    mainNextButton.addEventListener('click', () => {
        if (selectedGender === '') {
            alert('성별을 선택해 주세요.');
            return;
        }
        step2Title.textContent = `${selectedGender}의 출생년도를 말씀해 주세요.`;
        step1.style.display = 'none';
        step2.style.display = 'block';
        document.body.classList.add('step-2-bg');
        chapterCurrent.textContent = '2';
    });

    const goToStep3 = () => {
        step3Title.innerHTML = `${selectedGender}가 만드실<br>자서전의 제목은 무엇으로 할까요?`;
        step2.style.display = 'none';
        step3.style.display = 'block';
        chapterCurrent.textContent = '3';
    };

    const goToNextPage = () => {
        localStorage.setItem('autostartNarration', 'true');
        window.location.href = 'narration.html';
    };
});