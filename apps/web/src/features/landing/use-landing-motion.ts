'use client';

import { useEffect, type RefObject } from 'react';

const REVEAL_FIRST = 0.9;
const REVEAL_AT = 0.82;
const DRAW_START = 0.85;
const DRAW_SPAN = 0.35;
const HEAD_AT = 0.97;
const STAMP_AT = 0.85;

const clamp = (v: number) => Math.max(0, Math.min(1, v));

function drawConnector(link: Element, progress: number) {
  for (const svg of link.querySelectorAll('svg')) {
    const mask = svg.querySelector<SVGPathElement>('.ar-mask');
    const dash = svg.querySelector<SVGPathElement>('.ar-dash');
    const tip = svg.querySelector<SVGCircleElement>('.ar-tip');
    const head = svg.querySelector('.ar-head');
    if (mask) mask.style.strokeDashoffset = (1 - progress).toFixed(3);
    head?.classList.toggle('on', progress > HEAD_AT);
    if (dash && tip && dash.getTotalLength() > 0) {
      const point = dash.getPointAtLength(dash.getTotalLength() * progress);
      tip.setAttribute('cx', point.x.toFixed(1));
      tip.setAttribute('cy', point.y.toFixed(1));
    }
  }
}

export function useLandingMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let first = true;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const section of el.querySelectorAll('[data-sc]')) {
        const top = section.getBoundingClientRect().top;
        if (reduce || top < vh * (first ? REVEAL_FIRST : REVEAL_AT)) {
          section.querySelectorAll('.rvj').forEach((n) => n.classList.add('in'));
          if (section.classList.contains('rvj')) section.classList.add('in');
        }
      }
      for (const link of el.querySelectorAll('[data-lk]')) {
        const r = link.getBoundingClientRect();
        drawConnector(
          link,
          reduce ? 1 : clamp((vh * DRAW_START - r.top) / (r.height + vh * DRAW_SPAN)),
        );
      }
      if (!reduce) {
        for (const item of el.querySelectorAll<HTMLElement>('.px')) {
          const section = item.closest('.fx') ?? item;
          const r = section.getBoundingClientRect();
          const p = clamp((vh - r.top) / (vh + r.height));
          const distance = Number.parseFloat(getComputedStyle(item).getPropertyValue('--d')) || 40;
          item.style.transform = `translateY(${(distance * (1 - 2 * p)).toFixed(1)}px)`;
        }
        for (const stamp of el.querySelectorAll('.stamp.sv:not(.anim)')) {
          if (stamp.getBoundingClientRect().top < vh * STAMP_AT) stamp.classList.add('anim');
        }
      }
      first = false;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [root]);
}
