/* ============================================
   Onboarding — 단계별 가이드 투어
   react-joyride 기반, settingsStore 연동
   ============================================ */

import { useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import useSettingsStore from '../stores/settingsStore';

/* 투어 단계 정의 */
const steps = [
  {
    target: 'body',
    content: 'CreatorFlow에 오신 것을 환영합니다! 함께 콘텐츠를 만들어보세요.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '#nav-create',
    content: 'AI로 스크립트, 제목, 썸네일을 자동 생성하세요.',
  },
  {
    target: '#nav-library',
    content: '만든 콘텐츠를 관리하고 검색할 수 있습니다.',
  },
  {
    target: '#nav-trends',
    content: '인기 키워드를 분석하고 콘텐츠에 활용하세요.',
  },
  {
    target: '#nav-settings',
    content: 'API 키를 등록하고 테마를 변경하세요.',
  },
  {
    target: 'body',
    content: '준비 완료! 지금 바로 콘텐츠를 만들어보세요. 🎉',
    placement: 'center',
  },
];

/* Joyride 스타일 커스터마이징 (CSS 변수 활용) */
const joyrideStyles = {
  options: {
    arrowColor: 'var(--bg-secondary)',
    backgroundColor: 'var(--bg-secondary)',
    overlayColor: 'rgba(0, 0, 0, 0.7)',
    primaryColor: '#7c3aed',
    textColor: 'var(--text-primary)',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '16px',
    padding: '24px',
  },
  buttonNext: {
    backgroundColor: '#7c3aed',
    borderRadius: '8px',
    padding: '8px 20px',
  },
  buttonBack: {
    color: 'var(--text-secondary)',
  },
  buttonSkip: {
    color: 'var(--text-tertiary)',
  },
};

export default function Onboarding() {
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);

  /* 투어 상태 변경 핸들러 */
  const handleJoyrideCallback = useCallback(
    (data) => {
      const { status } = data;

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        setOnboardingCompleted(true);
      }
    },
    [setOnboardingCompleted]
  );

  /* 이미 온보딩을 완료했으면 렌더링하지 않음 */
  if (onboardingCompleted) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={!onboardingCompleted}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      callback={handleJoyrideCallback}
      styles={{
        ...joyrideStyles,
        options: {
          ...joyrideStyles.options,
          zIndex: 99999,
        },
        overlay: {
          zIndex: 99998,
        },
      }}
      floaterProps={{
        styles: {
          floater: { zIndex: 99999 },
        },
      }}
      locale={{
        back: '이전',
        close: '닫기',
        last: '완료',
        next: '다음',
        skip: '건너뛰기',
      }}
    />
  );
}
