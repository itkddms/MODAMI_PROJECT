document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 0) JSON 한 번만, 올바른 경로로
    const res = await fetch('data/assets_5year.json');
    const assets = await res.json();

    // 1) 출생연도/시기 정의
    const birthYear   = Number(localStorage.getItem('birthYear')) || 1955;
    const currentYear = 2025;

    const stages = {
      child:  { start: birthYear + 0,  end: birthYear + 12 }, // 0–12
      teen:   { start: birthYear + 13, end: birthYear + 19 }, // 13–19
      adult:  { start: birthYear + 20, end: birthYear + 39 }, // 20–39
      middle: { start: birthYear + 40, end: birthYear + 64 }, // 40–64
      senior: { start: birthYear + 65, end: currentYear }     // 65–현재
    };

    const get5Key = (year) => {
      const base = Math.floor((year - 1950) / 5) * 5 + 1950; // …,1950,1955,1960,…
      return String(base);
    };

    // 범위에 해당하는 5년 버킷(assets에 실제 존재하는 키만) 나열
    const getBuckets = (start, end) => {
      const s = new Set();
      for (let y = start; y <= end; y++) s.add(get5Key(y));
      // 실제 파일에 있는 키만 남기기
      return [...s].filter(k => assets[k]).sort((a,b)=>Number(a)-Number(b));
    };

    // 규칙: 홀수면 가운데, 짝수면 가운데 2개 중 랜덤
    const selectBucket = (bucketKeys) => {
      if (!bucketKeys || bucketKeys.length === 0) {
        // 폴백: 가장 가까운(또는 임의) 키
        const all = Object.keys(assets).sort((a,b)=>Number(a)-Number(b));
        return all[all.length - 1] || '2020';
      }
      const n = bucketKeys.length;
      if (n % 2 === 1) {
        const mid = Math.floor(n / 2);
        return bucketKeys[mid];
      } else {
        const r = Math.random() < 0.5 ? (n/2 - 1) : (n/2);
        return bucketKeys[r];
      }
    };

    // 시기별 대표 버킷 1개씩 고르기
    const chosen = {
      CHILD:  selectBucket(getBuckets(stages.child.start,  stages.child.end)),
      TEEN:   selectBucket(getBuckets(stages.teen.start,   stages.teen.end)),
      ADULT:  selectBucket(getBuckets(stages.adult.start,  stages.adult.end)),
      MIDDLE: selectBucket(getBuckets(stages.middle.start, stages.middle.end)),
      SENIOR: selectBucket(getBuckets(stages.senior.start, stages.senior.end)),
    };

    // 화면 메타
    const meta = {
      CHILD:  { title: '유아기 (0-12세)',     backgroundClass: 'history_child_bg'  },
      TEEN:   { title: '청소년기 (13-19세)',   backgroundClass: 'history_teen_bg'   },
      ADULT:  { title: '성인기 (20-39세)',    backgroundClass: 'history_adult_bg'  },
      MIDDLE: { title: '중년기 (40-64세)',    backgroundClass: 'history_middle_bg' },
      SENIOR: { title: '노년기 (65세 이상)',  backgroundClass: 'history_senior_bg' }
    };

    // 시기별 한 개 자산만 매핑
    const stagesByPeriod = {
      CHILD:  { title: meta.CHILD.title,  text: assets[chosen.CHILD]?.text  || '', music: assets[chosen.CHILD]?.music  || '', backgroundClass: meta.CHILD.backgroundClass },
      TEEN:   { title: meta.TEEN.title,   text: assets[chosen.TEEN]?.text   || '', music: assets[chosen.TEEN]?.music   || '', backgroundClass: meta.TEEN.backgroundClass },
      ADULT:  { title: meta.ADULT.title,  text: assets[chosen.ADULT]?.text  || '', music: assets[chosen.ADULT]?.music  || '', backgroundClass: meta.ADULT.backgroundClass },
      MIDDLE: { title: meta.MIDDLE.title, text: assets[chosen.MIDDLE]?.text || '', music: assets[chosen.MIDDLE]?.music || '', backgroundClass: meta.MIDDLE.backgroundClass },
      SENIOR: { title: meta.SENIOR.title, text: assets[chosen.SENIOR]?.text || '', music: assets[chosen.SENIOR]?.music || '', backgroundClass: meta.SENIOR.backgroundClass },
    };

    // 2) 기존 그룹/내비 로직 그대로
    const urlParams  = new URLSearchParams(window.location.search);
    const group      = urlParams.get('group') || 'childteen';
    const returnStep = urlParams.get('returnStep') || '1';

    const groups = {
      childteen:   ['CHILD', 'TEEN'],
      adultmiddle: ['ADULT', 'MIDDLE'],
      senior:      ['SENIOR']
    };
    const sequence = groups[group];
    if (!sequence) return;

    const narrationText       = document.getElementById('narrationText');
    const narrationAudio      = document.getElementById('narrationAudio');
    const backgroundContainer = document.getElementById('backgroundContainer');
    const nextBtn             = document.querySelector('.nextbtn');
    const pageTitleEl         = document.getElementById('page-title');

    let currentIndex = 0;

    function playStage(periodKey) {
      const s = stagesByPeriod[periodKey];
      if (!s) return;
      pageTitleEl.textContent = s.title;
      narrationText.textContent = s.text;
      narrationAudio.src = s.music;

      backgroundContainer.className = '';
      backgroundContainer.classList.add(s.backgroundClass);

      narrationAudio.play().catch(e => console.warn('자동재생 차단:', e));
    }

    function goNextStage() {
      narrationAudio.pause();
      currentIndex++;
      if (currentIndex < sequence.length) {
        playStage(sequence[currentIndex]);
      } else {
        sessionStorage.setItem('force_text_start', 'text4');
        window.location.href = `narration.html?step=${returnStep}&start=text4`;
      }
    }

    narrationAudio.addEventListener('ended', goNextStage);
    nextBtn?.addEventListener('click', goNextStage);

    // 시작
    playStage(sequence[currentIndex]);

  } catch (err) {
    console.error('❌ JSON 불러오기 오류:', err);
  }
});
